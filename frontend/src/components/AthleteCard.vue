<script setup lang="ts">
import {
  Athlete,
  DISCIPLINE_LABELS,
  AGE_CATEGORY_LABELS
} from '../types/athlete';

const props = defineProps<{
  athlete: Athlete;
}>();

const emit = defineEmits<{
  (e: 'log-workload', athlete: Athlete): void;
}>();

function handleLogWorkload() {
  emit('log-workload', props.athlete);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<template>
  <article class="athlete-card">
    <div class="card-header">
      <div class="avatar-box">
        <span class="avatar-text">{{ getInitials(athlete.full_name) }}</span>
      </div>

      <div class="badges-row">
        <span
          class="age-badge"
          :class="`age-${athlete.age_category.toLowerCase()}`"
        >
          {{ AGE_CATEGORY_LABELS[athlete.age_category] || athlete.age_category }}
        </span>
      </div>
    </div>

    <div class="card-body">
      <h2 class="athlete-name">{{ athlete.full_name }}</h2>

      <div class="discipline-tag" :class="`discipline-${athlete.primary_discipline.toLowerCase()}`">
        <span class="tag-dot"></span>
        {{ DISCIPLINE_LABELS[athlete.primary_discipline] }}
      </div>

      <div class="meta-row">
        <span class="meta-label">Joined</span>
        <span class="meta-value">{{ formatDate(athlete.created_at) }}</span>
      </div>
    </div>

    <div class="card-footer">
      <button
        class="action-btn"
        @click="handleLogWorkload"
        :title="`Log today's workload for ${athlete.full_name}`"
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
/* Athlete Card */
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
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.athlete-card:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1);
}

.athlete-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-box {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.125rem;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.age-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.age-u16 { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.age-u18 { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
.age-u20 { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.age-senior { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.athlete-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  line-height: 1.3;
}

.discipline-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.discipline-track_field {
  background: rgba(244, 63, 94, 0.1);
  color: #fb7185;
}
.discipline-track_field .tag-dot { background-color: #f43f5e; }

.discipline-cross_country {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
}
.discipline-cross_country .tag-dot { background-color: #10b981; }

.discipline-road {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}
.discipline-road .tag-dot { background-color: #3b82f6; }

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: #64748b;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}

.meta-value {
  color: #94a3b8;
  font-weight: 500;
}

/* Card Footer & Action Button */
.card-footer {
  padding-top: 0.5rem;
}

.action-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
}

.action-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.4);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
