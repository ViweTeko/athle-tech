/**
 * @fileoverview Domain Composable: JWT Authentication & Session Token Management.
 * @module frontend/src/auth/useAuth
 *
 * Manages JWT access and refresh token lifecycle, local persistence,
 * reactive auth status, and token rotation dispatches to SimpleJWT endpoints.
 */

import { ref, computed } from 'vue';
import router from '../router';

export const ACCESS_KEY = 'athletech_access_token';
export const REFRESH_KEY = 'athletech_refresh_token';

const accessToken = ref<string | null>(localStorage.getItem(ACCESS_KEY));
const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

// In-flight refresh promise mutex to deduplicate concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

export function useAuth() {
    const isAuthenticated = computed(() => !!accessToken.value);

    const setTokens = (access: string, refresh?: string): void => {
        accessToken.value = access;
        localStorage.setItem(ACCESS_KEY, access);

        if (refresh) {
            refreshToken.value = refresh;
            localStorage.setItem(REFRESH_KEY, refresh);
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        loading.value = true;
        error.value = null;

        try {
            const res = await fetch('/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                throw new Error('Invalid username or password.');
            }

            const data = await res.json();
            setTokens(data.access, data.refresh);

            await router.push('/');
            return true;
        } catch (err: any) {
            error.value = err.message || 'Authentication failed.';
            return false;
        } finally {
            loading.value = false;
        }
    };

    const logout = (): void => {
        accessToken.value = null;
        refreshToken.value = null;
        refreshPromise = null;
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        router.push('/login');
    };

    /**
     * Refreshes the short-lived access token using the stored refresh token.
     * Leverages a singleton promise to ensure simultaneous 401 responses share
     * a single refresh network request.
     */
    const refreshAccessToken = async (): Promise<string | null> => {
        if (refreshPromise) {
            return refreshPromise;
        }

        const currentRefresh = refreshToken.value || localStorage.getItem(REFRESH_KEY);
        if (!currentRefresh) {
            logout();
            return null;
        }

        refreshPromise = (async () => {
            try {
                const res = await fetch('/api/token/refresh/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: currentRefresh }),
                });

                if (!res.ok) {
                    throw new Error('Refresh token expired or invalid');
                }

                const data = await res.json();
                // If ROTATE_REFRESH_TOKENS=True, SimpleJWT may return a new refresh token as well
                setTokens(data.access, data.refresh);
                return data.access as string;
            } catch (err) {
                logout();
                return null;
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    };

    const getAuthHeaders = (): Record<string, string> => {
        const token = accessToken.value || localStorage.getItem(ACCESS_KEY);
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    };

    return {
        accessToken,
        refreshToken,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        refreshAccessToken,
        getAuthHeaders,
    };
}