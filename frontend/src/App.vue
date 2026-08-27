<!--
  frontend/src/App.vue

  Root application shell for Athle-Tech.
  Provides persistent top navigation, toast notifications, and dynamic
  client-side page rendering via Vue Router.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { Athlete } from './components/athletes/types';

const notification = ref<string | null>(null);

function handleLogWorkload(athlete: Athlete) {
  notification.value = `Navigating to Workload Logger for ${athlete.first_name} ${athlete.last_name} (${athlete.id.slice(0, 8)}...)`;
  setTimeout(() => {
    notification.value = null;
  }, 4000);
}
</script>

<template>
  <div class="app-layout min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
    <!-- Top Navigation Header -->
    <header class="bg-slate-950 border-b border-slate-800 shadow-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-xl font-bold tracking-tight text-emerald-400">Athle-Tech</span>
        </div>
        <nav class="flex space-x-6 text-sm font-semibold">
          <RouterLink 
            to="/" 
            class="text-slate-300 hover:text-emerald-400 transition-colors py-1"
            active-class="text-emerald-400 border-b-2 border-emerald-400"
          >
            Dashboard
          </RouterLink>
          <RouterLink 
            to="/athletes" 
            class="text-slate-300 hover:text-emerald-400 transition-colors py-1"
            active-class="text-emerald-400 border-b-2 border-emerald-400"
          >
            Athletes
          </RouterLink>
          <RouterLink 
            to="/attendance" 
            class="text-slate-300 hover:text-emerald-400 transition-colors py-1"
            active-class="text-emerald-400 border-b-2 border-emerald-400"
          >
            Attendance
          </RouterLink>
          <RouterLink 
            to="/performance" 
            class="text-slate-300 hover:text-emerald-400 transition-colors py-1"
            active-class="text-emerald-400 border-b-2 border-emerald-400"
          >
            Performance
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Toast Notification Banner -->
    <transition name="toast">
      <div v-if="notification" class="toast-banner" role="alert">
        <span class="toast-icon">⚡</span>
        <span class="toast-message">{{ notification }}</span>
      </div>
    </transition>

    <!-- Main View Outlet -->
    <main class="app-shell flex-grow max-w-7xl w-full mx-auto p-6">
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