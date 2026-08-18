<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Athlete,
  DisciplineFilter,
  PrimaryDiscipline,
  DISCIPLINE_LABELS,
  AGE_CATEGORY_LABELS
} from '../types/athlete';

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
    <section class="roster-toolbar">
      <!-- Search input -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="2" />
          <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search athlete by name..."
          aria-label="Search athletes by name"
        />
        <button
          v-if="searchQuery"
          class="clear-search"
          @click="searchQuery = ''"
          title="Clear search"
        >
          &times;
        </button>
      </div>

      <!-- Filter pills -->
      <div class="filter-pills" role="tablist" aria-label="Discipline filter">
        <button
          class="pill-btn"
          :class="{ active: selectedFilter === 'ALL' }"
          @click="setFilter('ALL')"
          role="tab"
          :aria-selected="selectedFilter === 'ALL'"
        >
          All Disciplines
          <span class="pill-count">{{ stats.total }}</span>
        </button>

        <button
          class="pill-btn pill-track"
          :class="{ active: selectedFilter === 'TRACK_FIELD' }"
          @click="setFilter('TRACK_FIELD')"
          role="tab"
          :aria-selected="selectedFilter === 'TRACK_FIELD'"
        >
          Track & Field
          <span class="pill-count">{{ stats.track }}</span>
        </button>

        <button
          class="pill-btn pill-xc"
          :class="{ active: selectedFilter === 'CROSS_COUNTRY' }"
          @click="setFilter('CROSS_COUNTRY')"
          role="tab"
          :aria-selected="selectedFilter === 'CROSS_COUNTRY'"
        >
          Cross Country
          <span class="pill-count">{{ stats.xc }}</span>
        </button>

        <button
          class="pill-btn pill-road"
          :class="{ active: selectedFilter === 'ROAD' }"
          @click="setFilter('ROAD')"
          role="tab"
          :aria-selected="selectedFilter === 'ROAD'"
        >
          Road Racing
          <span class="pill-count">{{ stats.road }}</span>
        </button>
      </div>
    </section>

    <!-- Loading Skeleton State -->
    <div v-if="loading" class="cards-grid">
      <div v-for="i in 4" :key="i" class="athlete-card skeleton-card">
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
      <article
        v-for="athlete in filteredAthletes"
        :key="athlete.athlete_id"
        class="athlete-card"
      >
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
            @click="handleLogWorkload(athlete)"
            :title="`Log today's workload for ${athlete.full_name}`"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" />
            </svg>
            Log Today's Workload
          </button>
        </div>
      </article>
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

/* Toolbar: Search and Filter Pills */
.roster-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
  background: rgba(15, 23, 42, 0.8);
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@media (min-width: 900px) {
  .roster-toolbar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: #64748b;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 0.625rem 2.25rem 0.625rem 2.625rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f8fafc;
  font-size: 0.9375rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-box input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.clear-search:hover { color: #f8fafc; }

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #f8fafc;
}

.pill-btn.active {
  background: #38bdf8;
  border-color: #38bdf8;
  color: #0f172a;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.pill-track.active {
  background: #f43f5e;
  border-color: #f43f5e;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.pill-xc.active {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.pill-road.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.pill-count {
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.75rem;
  font-weight: 600;
}

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
