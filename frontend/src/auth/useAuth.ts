// frontend/src/auth/useAuth.ts
import { ref, computed } from 'vue';
import router from '../router';

const ACCESS_KEY = 'athletech_access_token';
const REFRESH_KEY = 'athletech_refresh_token';

const accessToken = ref<string | null>(localStorage.getItem(ACCESS_KEY));
const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
const loading = ref(false);
const error = ref<string | null>(null);

export function useAuth() {
    const isAuthenticated = computed(() => !!accessToken.value);

    const login = async (username: string, password: string): Promise<boolean> => {
        loading.value = true;
        error.value = null;

        try {
            const res = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                throw new Error('Invalid username or password.');
            }

            const data = await res.json();
            accessToken.value = data.access;
            refreshToken.value = data.refresh;

            localStorage.setItem(ACCESS_KEY, data.access);
            localStorage.setItem(REFRESH_KEY, data.refresh);

            await router.push('/');
            return true;
        } catch (err: any) {
            error.value = err.message || 'Authentication failed.';
            return false;
        } finally {
            loading.value = false;
        }
    };

    const logout = () => {
        accessToken.value = null;
        refreshToken.value = null;
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        router.push('/login');
    };

    const getAuthHeaders = (): Record<string, string> => {
        if (!accessToken.value) return {};
        return { Authorization: `Bearer ${accessToken.value}` };
    };

    return {
        accessToken,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        getAuthHeaders,
    };
}