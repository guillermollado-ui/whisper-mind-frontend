/**
 * utils/api.ts
 * Single source of truth for API configuration and authenticated fetch.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Día 22: API_URL por entorno. EXPO_PUBLIC_API_URL se fija en el build (eas.json / .env);
// sin esa variable, se usa la de producción en Render.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wishpermind-backend.onrender.com';

const TOKEN_KEY = 'user_token';
const REFRESH_KEY = 'user_refresh_token';

/**
 * Retrieve the stored JWT access token.
 */
export const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(REFRESH_KEY);
  return await SecureStore.getItemAsync(REFRESH_KEY);
};

/**
 * TASK-04: guarda el access y el refresh token juntos. Login, registro y Google llaman a
 * esto en vez de manejar SecureStore/localStorage cada uno por su lado.
 */
export const storeTokens = async (accessToken: string, refreshToken?: string | null) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
};

const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  } catch (e) {}
};

/**
 * Clear the stored tokens. Called automatically when a 401 survives a refresh attempt.
 */
export const handleTokenExpired = async () => {
  await clearTokens();
  // router.replace('/login'); // A veces da error si no estás en contexto, mejor dejarlo o usar navegación segura
};

// TASK-05: cierra sesión también en el backend (revoca el access token y el refresh), y
// limpia los tokens locales. Si el backend no responde, se limpia igual: no hay que quedarse
// atrapado en la app por un Render caído.
export const logoutRequest = async (): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (e) {
    // sin red o backend caído: se sigue limpiando localmente.
  } finally {
    await clearTokens();
  }
};

// Varias peticiones 401 a la vez (p. ej. al volver de background) no deben disparar N
// refresh en paralelo: todas comparten el mismo intento en curso.
let refreshEnVuelo: Promise<string | null> | null = null;

async function refrescarAccessToken(): Promise<string | null> {
  if (!refreshEnVuelo) {
    refreshEnVuelo = (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return null;
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.access_token) return null;
        await storeTokens(data.access_token, data.refresh_token);
        return data.access_token as string;
      } catch (e) {
        return null;
      } finally {
        refreshEnVuelo = null;
      }
    })();
  }
  return refreshEnVuelo;
}

/**
 * Wrapper around fetch that handles Auth and Errors.
 */
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const fullUrl = path.startsWith('http') ? path : `${API_URL}${path}`;
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(fullUrl, { ...options, headers });
  };

  if (__DEV__) console.log(`📡 Fetching: ${fullUrl}`);

  let token = await getAuthToken();
  let response = await doFetch(token);

  // TASK-04: un 401 ya no desloguea directamente. Con el access token corto (1 h), esto
  // pasaría varias veces al día; se intenta un refresh y, si funciona, se repite la petición
  // una sola vez con el token nuevo.
  if (response.status === 401) {
    const nuevoToken = await refrescarAccessToken();
    if (nuevoToken) {
      response = await doFetch(nuevoToken);
    }
    if (response.status === 401) {
      await handleTokenExpired();
      throw new Error('SESSION_EXPIRED');
    }
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
