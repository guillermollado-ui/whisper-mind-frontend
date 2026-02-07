/**
 * utils/api.ts
 * Single source of truth for API configuration and authenticated fetch.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// 🔴 CAMBIO IMPORTANTE: AHORA APUNTAMOS A TU ORDENADOR LOCAL
export const API_URL = 'https://wishpermind-backend.onrender.com'; 
// (Cuando subas a producción, volverás a poner la de Render)

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
  // router.replace('/login'); // A veces da error si no estás en contexto, mejor dejarlo o usar navegación segura
};

/**
 * Wrapper around fetch that handles Auth and Errors.
 */
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json', // Añadido por seguridad
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construcción segura de la URL
  const fullUrl = path.startsWith('http') ? path : `${API_URL}${path}`;

  console.log(`📡 Fetching: ${fullUrl}`); // Log para depurar

  const response = await fetch(fullUrl, {
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