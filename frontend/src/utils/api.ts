// frontend/src/utils/api.ts
import { useAuth } from '../auth/useAuth';

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { getAuthHeaders, logout } = useAuth();

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData) || `Request failed with status ${response.status}`);
    }

    return response.json();
}