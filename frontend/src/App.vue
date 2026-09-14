<!--
  @fileoverview Root application shell with top navigation and view routing.
  @module frontend/src/App.vue
-->
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { Athlete } from './components/athletes/types';
import { useAuth } from './auth/useAuth';

const router = useRouter();
const { isAuthenticated, logout } = useAuth();
const notification = ref<string | null>(null);

function handleLogWorkload(athlete: Athlete) {
  notification.value = `Opening logger for ${athlete.first_name} ${athlete.last_name}...`;
  setTimeout(() => {
    notification.value = null;
  }, 2500);
  router.push(`/attendance?athlete=${athlete.id}`);
}
</script>

<template>
  <div class="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
    <header class="bg-surface/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-xl font-black tracking-tight text-emerald-400">⚡ Athle-Tech</span>
        </div>
        <nav class="flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider">
          <RouterLink to="/" class="text-slate-300 hover:text-emerald-400 transition-colors py-1" active-class="text-emerald-400 border-b-2 border-emerald-400">Dashboard</RouterLink>
          <RouterLink to="/athletes" class="text-slate-300 hover:text-emerald-400 transition-colors py-1" active-class="text-emerald-400 border-b-2 border-emerald-400">Athletes</RouterLink>
          <RouterLink to="/attendance" class="text-slate-300 hover:text-emerald-400 transition-colors py-1" active-class="text-emerald-400 border-b-2 border-emerald-400">Attendance</RouterLink>
          <RouterLink to="/performance" class="text-slate-300 hover:text-emerald-400 transition-colors py-1" active-class="text-emerald-400 border-b-2 border-emerald-400">Performance</RouterLink>
          <button
            v-if="isAuthenticated"
            @click="logout"
            class="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded border border-rose-900/60 hover:border-rose-700 transition"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>

    <transition name="toast">
      <div v-if="notification" class="fixed top-16 right-6 z-50 bg-indigo-600 border border-indigo-400 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold">
        {{ notification }}
      </div>
    </transition>

    <main class="flex-grow max-w-7xl w-full mx-auto p-6">
      <RouterView @log-workload="handleLogWorkload" />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
}

.toast-banner {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: #0284c7;
  color: #ffffff;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>