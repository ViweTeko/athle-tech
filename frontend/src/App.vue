<script setup lang="ts">
import { ref } from 'vue';
import AthleteRoster from './components/athletes/AthleteRoster.vue';
import { Athlete } from './components/athletes/types';

const notification = ref<string | null>(null);

function handleLogWorkload(athlete: Athlete) {
  notification.value = `Navigating to Workload Logger for ${athlete.full_name} (${athlete.athlete_id.slice(0, 8)}...)`;
  setTimeout(() => {
    notification.value = null;
  }, 4000);
}
</script>

<template>
  <main class="app-shell">
    <!-- Toast Notification Banner -->
    <transition name="toast">
      <div v-if="notification" class="toast-banner" role="alert">
        <span class="toast-icon">⚡</span>
        <span class="toast-message">{{ notification }}</span>
      </div>
    </transition>

    <AthleteRoster @log-workload="handleLogWorkload" />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
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
