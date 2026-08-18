<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Athlete,
  DisciplineFilter
} from '../types/athlete';
import RosterToolbar from './RosterToolbar.vue';
import AthleteCard from './AthleteCard.vue';

const props = withDefaults(
  defineProps<{
    athletes?: Athlete[];
    loading?: boolean;
    apiEndpoint?: string;
  }>(),
  {
    athletes: undefined,
    loading: false,
    apiEndpoint: '/api/athletes/'
  }
);

const emit = defineEmits<{
  (e: 'log-workload', athlete: Athlete): void;
  (e: 'select-athlete', athlete: Athlete): void;
  (e: 'filter-change', filter: DisciplineFilter): void;
}>();

// Default Mock Data if no props provided
const mockAthletes: Athlete[] = [
  {
    athlete_id: '101e4567-e89b-12d3-a456-426614174001',
    full_name: 'Sipho Ndlovu',
    age_category: 'U20',
    primary_discipline: 'TRACK_FIELD',
    created_at: '2026-01-15T08:30:00Z'
  },
  {
    athlete_id: '202e4567-e89b-12d3-a456-426614174002',
    full_name: 'Anika van Zyl',
    age_category: 'SENIOR',
    primary_discipline: 'CROSS_COUNTRY',
    created_at: '2026-02-01T10:15:00Z'
  },
  {
    athlete_id: '303e4567-e89b-12d3-a456-426614174003',
    full_name: 'Lethabo Mokoena',
    age_category: 'U18',
    primary_discipline: 'TRACK_FIELD',
    created_at: '2026-02-10T14:20:00Z'
  },
  {
    athlete_id: '404e4567-e89b-12d3-a456-426614174004',
    full_name: 'Pieter Botha',
    age_category: 'SENIOR',
    primary_discipline: 'ROAD',
    created_at: '2026-03-05T09:00:00Z'
  },
  {
    athlete_id: '505e4567-e89b-12d3-a456-426614174005',
    full_name: 'Zola Khumalo',
    age_category: 'U16',
    primary_discipline: 'CROSS_COUNTRY',
    created_at: '2026-03-12T11:45:00Z'
  },
  {
    athlete_id: '606e4567-e89b-12d3-a456-426614174006',
    full_name: 'Jessica Daniels',
    age_category: 'U20',
    primary_discipline: 'ROAD',
    created_at: '2026-04-02T16:10:00Z'
  }
];

const selectedFilter = ref<DisciplineFilter>('ALL');
const searchQuery = ref('');

const rosterList = computed<Athlete[]>(() => props.athletes ?? mockAthletes);

const stats = computed(() => {
  const list = rosterList.value;
  return {
    total: list.length,
    track: list.filter((a) => a.primary_discipline === 'TRACK_FIELD').length,
    xc: list.filter((a) => a.primary_discipline === 'CROSS_COUNTRY').length,
    road: list.filter((a) => a.primary_discipline === 'ROAD').length
  };
});

const filteredAthletes = computed(() => {
  return rosterList.value.filter((athlete) => {
    const matchesFilter =
      selectedFilter.value === 'ALL' ||
      athlete.primary_discipline === selectedFilter.value;
    const matchesSearch = athlete.full_name
      .toLowerCase()
      .includes(searchQuery.value.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
});

function setFilter(filter: DisciplineFilter) {
  selectedFilter.value = filter;
  emit('filter-change', filter);
}

function handleLogWorkload(athlete: Athlete) {
  emit('log-workload', athlete);
}
</script>

<template>
  <div class="roster-container">
    <!-- Header Section -->
    <header class="roster-header">
      <div class="header-titles">
        <div class="subtitle-badge">
          <span class="pulse-dot"></span>
          Athle-Tech Roster Engine
        </div>
        <h1 class="main-title">Athlete Roster</h1>
        <p class="description">
          Monitor performance categories, track active disciplines, and rapidly log workload entries.
        </p>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-value">{{ stats.total }}</span>
          <span class="metric-label">Total Athletes</span>
        </div>
        <div class="metric-card highlight-track">
          <span class="metric-value">{{ stats.track }}</span>
          <span class="metric-label">Track & Field</span>
        </div>
        <div class="metric-card highlight-xc">
          <span class="metric-value">{{ stats.xc }}</span>
          <span class="metric-label">Cross Country</span>
        </div>
        <div class="metric-card highlight-road">
          <span class="metric-value">{{ stats.road }}</span>
          <span class="metric-label">Road Racing</span>
        </div>
      </div>
    </header>

    <!-- Toolbar: Search & Filter Pills -->
    <RosterToolbar
      v-model:search-query="searchQuery"
      v-model:selected-filter="selectedFilter"
      :stats="stats"
      @filter-change="setFilter"
    />

    <!-- Loading Skeleton State -->
    <div v-if="loading" class="cards-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text line-1"></div>
        <div class="skeleton-text line-2"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAthletes.length === 0" class="empty-state">
      <div class="empty-icon">🏃🏽‍♂️</div>
      <h3>No Athletes Found</h3>
      <p>No athlete matches your current filter or search criteria.</p>
      <button class="reset-btn" @click="selectedFilter = 'ALL'; searchQuery = '';">
        Reset Filters
      </button>
    </div>

    <!-- Athletes Grid -->
    <div v-else class="cards-grid">
      <AthleteCard
        v-for="athlete in filteredAthletes"
        :key="athlete.athlete_id"
        :athlete="athlete"
        @log-workload="handleLogWorkload"
      />
    </div>
  </div>
</template>

<style scoped>
/* Dark Mode Modern Palette & Design System */
.roster-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f1f5f9;
  background-color: #0b0f19;
  min-height: 100vh;
}

/* Header */
.roster-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (min-width: 900px) {
  .roster-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.header-titles {
  max-width: 600px;
}

.subtitle-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.4; transform: scale(0.9); }
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.5rem 0;
}

.description {
  color: #94a3b8;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

/* Metrics summary */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.metric-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.875rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
}

.metric-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.highlight-track .metric-value { color: #f43f5e; }
.highlight-xc .metric-value { color: #10b981; }
.highlight-road .metric-value { color: #3b82f6; }

/* Cards Grid Layout */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #94a3b8;
  margin: 0 0 1.5rem 0;
}

.reset-btn {
  padding: 0.625rem 1.25rem;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.reset-btn:hover {
  background: #475569;
}

/* Skeleton Loading State */
.skeleton-card {
  height: 240px;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  animation: pulse-bg 1.5s infinite ease-in-out;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
}

.skeleton-text {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
}

.skeleton-text.line-1 {
  width: 70%;
  height: 1.25rem;
}

.skeleton-text.line-2 {
  width: 40%;
  height: 1rem;
}

.skeleton-button {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

@keyframes pulse-bg {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}
</style>
