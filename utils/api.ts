/**
 * utils/api.ts
 * Single source of truth for API configuration and authenticated fetch.
 * 
 * Fixes addressed:
 *  - API_URL was duplicated as a hardcoded string in 6 files.
 *  - No handling of 401 (expired token) responses anywhere in the app.
 *  - No handling of 429 (rate-limited) responses.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const API_URL = 'https://wishpermind-backend.onrender.com';

/**
 * Retrieve the stored JWT token.
 */
export const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem('user_token');
  return await SecureStore.getItemAsync('user_token');
};

/**
 * Clear the stored token and navigate to login.
 * Called automatically when a 401 is detected.
 */
export const handleTokenExpired = async () => {
  try {
    await SecureStore.deleteItemAsync('user_token');
    if (Platform.OS === 'web') localStorage.removeItem('user_token');
  } catch (e) {}
  router.replace('/login');
};

/**
 * Wrapper around fetch that:
 *  1. Automatically injects the Authorization header.
 *  2. Detects 401 → clears token and redirects to login.
 *  3. Detects 429 → throws a clear "rate limited" error.
 *  4. Returns the raw Response so callers can .json() as needed.
 */
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Token expired or invalid
  if (response.status === 401) {
    await handleTokenExpired();
    throw new Error('SESSION_EXPIRED');
  }

  // Rate limited
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
    throw new Error(`RATE_LIMITED:${seconds}`);
  }

  return response;
};

/**
 * Parse a rate-limit error into a user-friendly message.
 */
export const parseRateLimitError = (error: Error): string | null => {
  if (error.message?.startsWith('RATE_LIMITED:')) {
    const seconds = error.message.split(':')[1];
    return `Too many attempts. Please wait ${seconds} seconds.`;
  }
  return null;
};
