<!-- frontend/src/views/Login.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../auth/useAuth';

const username = ref('');
const password = ref('');
const { login, loading, error } = useAuth();

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  await login(username.value, password.value);
};
</script>

<template>
  <div class="min-h-[75vh] flex items-center justify-center">
    <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>⚡</span> Athle-Tech
        </h1>
        <p class="text-xs text-slate-400">Coach & Sports Science Portal Authentication</p>
      </div>

      <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="e.g., coach"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg mt-2"
        >
          {{ loading ? 'Authenticating...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>