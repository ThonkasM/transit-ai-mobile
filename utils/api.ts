import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

let onLogout: (() => void) | null = null;

export function setOnLogout(cb: () => void) {
  onLogout = cb;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const api = {
  async fetch<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (!skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let res = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers,
    });

    if (res.status === 401 && !skipAuth) {
      const newToken = await refreshTokens();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${endpoint}`, { ...rest, headers });
      } else {
        await clearTokens();
        onLogout?.();
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || 'Request failed');
    }

    return res.json();
  },

  get<T = unknown>(endpoint: string, options?: FetchOptions) {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(endpoint: string, options?: FetchOptions) {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
