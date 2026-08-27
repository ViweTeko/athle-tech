<!--
  frontend/src/components/athletes/AthleteCard.vue

  Renders an athlete's summary card including their name, gender, primary event,
  registration date, active status, and a workload logging action button.
-->
<script setup lang="ts">
import { Athlete, PRIMARY_EVENT_LABELS, STATUS_LABELS } from './types';
import { getInitials, formatDate } from '../../utils/formatters';

const props = defineProps<{
  athlete: Athlete;
}>();

const emit = defineEmits<{
  (e: 'log-workload', athlete: Athlete): void;
}>();

function handleLogWorkload() {
  emit('log-workload', props.athlete);
}
</script>

<template>
  <article class="athlete-card">
    <div class="card-header">
      <div class="avatar-box">
        <span class="avatar-text">{{ getInitials(`${athlete.first_name} ${athlete.last_name}`) }}</span>
      </div>

      <div class="badges-row">
        <span
          class="status-badge"
          :class="`status-${athlete.status.toLowerCase()}`"
        >
          {{ STATUS_LABELS[athlete.status] }}
        </span>
      </div>
    </div>

    <div class="card-body">
      <h2 class="athlete-name">{{ athlete.first_name }} {{ athlete.last_name }}</h2>

      <div class="event-tag">
        <span class="tag-dot"></span>
        {{ PRIMARY_EVENT_LABELS[athlete.primary_event] }}
      </div>

      <div class="meta-row">
        <span class="meta-label">Registered</span>
        <span class="meta-value">{{ formatDate(athlete.created_at) }}</span>
      </div>
    </div>

    <div class="card-footer">
      <button
        class="action-btn"
        @click="handleLogWorkload"
        :title="`Log today's workload for ${athlete.first_name} ${athlete.last_name}`"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" />
        </svg>
        Log Today's Workload
      </button>
    </div>
  </article>
</template>

<style scoped>
.athlete-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.athlete-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.athlete-card:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,.5), 0 0 20px rgba(56,189,248,.1);
}

.athlete-card:hover::before { opacity: 1; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-box {
  width: 48px; height: 48px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-weight: 700; font-size: 1.125rem;
  box-shadow: 0 4px 10px rgba(59,130,246,.3);
}

.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
}

.status-active   { background: rgba(16,185,129,.15); color: #34d399; border: 1px solid rgba(16,185,129,.3); }
.status-injured  { background: rgba(244,63,94,.15);  color: #fb7185; border: 1px solid rgba(244,63,94,.3); }
.status-resting  { background: rgba(245,158,11,.15); color: #fbbf24; border: 1px solid rgba(245,158,11,.3); }
.status-inactive { background: rgba(100,116,139,.15); color: #94a3b8; border: 1px solid rgba(100,116,139,.3); }

.card-body { display: flex; flex-direction: column; gap: 0.75rem; }

.athlete-name {
  font-size: 1.25rem; font-weight: 700; color: #f8fafc;
  margin: 0; line-height: 1.3;
}

.event-tag {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; font-weight: 600;
  width: fit-content; padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  background: rgba(56,189,248,.1); color: #38bdf8;
}

.tag-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background-color: #38bdf8;
}

.meta-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.8125rem; color: #64748b;
  border-top: 1px dashed rgba(255,255,255,.08);
  padding-top: 0.75rem; margin-top: 0.25rem;
}

.meta-value { color: #94a3b8; font-weight: 500; }

.card-footer { padding-top: 0.5rem; }

.action-btn {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #fff; border: none; border-radius: 0.625rem;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(2,132,199,.25);
}

.action-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2,132,199,.4);
}

.action-btn:active { transform: translateY(0); }

.btn-icon { width: 1.125rem; height: 1.125rem; }
</style>
