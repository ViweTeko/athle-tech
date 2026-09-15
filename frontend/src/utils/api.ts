/**
 * @fileoverview Central HTTP Client Utility with Transparent JWT Refresh Interceptor.
 * @module frontend/src/utils/api
 *
 * Wraps Fetch API with base URL resolution, default headers injection,
 * automatic 401 interception, silent access token rotation, and single-attempt replay.
 */

import { useAuth } from '../auth/useAuth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
    _isRetry?: boolean;
}

/**
 * Dispatches an authenticated request to the DRF API with automatic token injection
 * and silent 401 retry interceptor.
 *
 * @template T
 * @param endpoint - Relative API route (e.g. '/athletes/') or absolute URL.
 * @param options - Standard fetch RequestInit configuration with retry flags.
 * @returns Promise resolving to the parsed JSON response body.
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { getAuthHeaders, refreshAccessToken, logout } = useAuth();

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {}),
    };

    let response: Response;

    try {
        response = await fetch(url, { ...options, headers });
    } catch (networkError: any) {
        throw new Error(networkError.message || 'Network communication error.');
    }

    // Intercept 401 Unauthorized only on non-retry attempts and non-auth endpoints
    if (response.status === 401 && !options._isRetry && !url.includes('/token/')) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            // Re-issue the original request with the fresh token and _isRetry marked
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newAccessToken}`,
            };

            const retryResponse = await fetch(url, {
                ...options,
                headers: retryHeaders,
                _isRetry: true,
            } as RequestOptions);

            if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(JSON.stringify(errorData) || `Request failed with status ${retryResponse.status}`);
            }

            return retryResponse.json();
        } else {
            logout();
            throw new Error('Session expired. Please log in again.');
        }
    }

    if (response.status === 401) {
        logout();
        throw new Error('Session unauthorized.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData) || `Request failed with status ${response.status}`);
    }

    return response.json();
}

/**
 * Triggers an authenticated file stream download with JWT authorization.
 *
 * @param endpoint - Target API endpoint.
 * @param defaultFilename - Suggested fallback filename.
 */
export async function apiDownload(endpoint: string, defaultFilename: string = 'export.csv'): Promise<void> {
    const { getAuthHeaders, refreshAccessToken, logout } = useAuth();
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, {
        method: 'GET',
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${newToken}`,
                },
            });
        } else {
            logout();
            throw new Error('Session expired. Please log in again.');
        }
    }

    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;

    // Read filename from content-disposition header if present
    const disposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
    }

    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(downloadUrl);
}