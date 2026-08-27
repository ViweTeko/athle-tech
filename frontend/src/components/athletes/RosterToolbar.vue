<!--
  frontend/src/components/athletes/RosterToolbar.vue

  Provides controls for filtering athletes by roster status and searching by name.
  Emits v-model-compatible events for two-way binding from AthleteRoster.vue.
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { StatusFilter } from './useAthletes';

const props = defineProps<{
  searchQuery: string;
  selectedStatus: StatusFilter;
  stats: { total: number; active: number; injured: number; resting: number };
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:selectedStatus', val: StatusFilter): void;
}>();

const searchVal = computed({
  get() { return props.searchQuery; },
  set(val) { emit('update:searchQuery', val); },
});

function setStatus(status: StatusFilter) {
  emit('update:selectedStatus', status);
}
</script>

<template>
  <section class="roster-toolbar">
    <!-- Search input -->
    <div class="search-box">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8" stroke-width="2" />
        <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input
        v-model="searchVal"
        type="text"
        placeholder="Search athlete by name..."
        aria-label="Search athletes by name"
      />
      <button v-if="searchVal" class="clear-search" @click="searchVal = ''" title="Clear search">
        &times;
      </button>
    </div>

    <!-- Status filter pills -->
    <div class="filter-pills" role="tablist" aria-label="Status filter">
      <button
        class="pill-btn"
        :class="{ active: selectedStatus === 'ALL' }"
        @click="setStatus('ALL')"
        role="tab" :aria-selected="selectedStatus === 'ALL'"
      >
        All <span class="pill-count">{{ stats.total }}</span>
      </button>
      <button
        class="pill-btn pill-active"
        :class="{ active: selectedStatus === 'ACTIVE' }"
        @click="setStatus('ACTIVE')"
        role="tab" :aria-selected="selectedStatus === 'ACTIVE'"
      >
        Active <span class="pill-count">{{ stats.active }}</span>
      </button>
      <button
        class="pill-btn pill-injured"
        :class="{ active: selectedStatus === 'INJURED' }"
        @click="setStatus('INJURED')"
        role="tab" :aria-selected="selectedStatus === 'INJURED'"
      >
        Injured <span class="pill-count">{{ stats.injured }}</span>
      </button>
      <button
        class="pill-btn pill-resting"
        :class="{ active: selectedStatus === 'RESTING' }"
        @click="setStatus('RESTING')"
        role="tab" :aria-selected="selectedStatus === 'RESTING'"
      >
        Resting <span class="pill-count">{{ stats.resting }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.roster-toolbar {
  display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem;
  background: rgba(15,23,42,.8); padding: 1.25rem; border-radius: 1rem;
  border: 1px solid rgba(255,255,255,.05);
}

@media (min-width: 900px) {
  .roster-toolbar { flex-direction: row; justify-content: space-between; align-items: center; }
}

.search-box { position: relative; width: 100%; max-width: 380px; }

.search-icon {
  position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
  width: 1.125rem; height: 1.125rem; color: #64748b; pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 0.625rem 2.25rem 0.625rem 2.625rem;
  background: rgba(30,41,59,.8); border: 1px solid rgba(255,255,255,.1);
  border-radius: 0.5rem; color: #f8fafc; font-size: 0.9375rem;
  outline: none; transition: all .2s ease;
}

.search-box input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,.15);
}

.clear-search {
  position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer;
  padding: 0; line-height: 1;
}

.clear-search:hover { color: #f8fafc; }

.filter-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.pill-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem; border-radius: 9999px;
  background: rgba(30,41,59,.7); border: 1px solid rgba(255,255,255,.08);
  color: #94a3b8; font-size: 0.875rem; font-weight: 500; cursor: pointer;
  transition: all .2s ease;
}

.pill-btn:hover { background: rgba(51,65,85,.8); color: #f8fafc; }

.pill-btn.active {
  background: #38bdf8; border-color: #38bdf8; color: #0f172a;
  font-weight: 700; box-shadow: 0 4px 12px rgba(56,189,248,.3);
}

.pill-active.active  { background: #10b981; border-color: #10b981; color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,.3); }
.pill-injured.active { background: #f43f5e; border-color: #f43f5e; color: #fff; box-shadow: 0 4px 12px rgba(244,63,94,.3); }
.pill-resting.active { background: #f59e0b; border-color: #f59e0b; color: #fff; box-shadow: 0 4px 12px rgba(245,158,11,.3); }

.pill-count {
  padding: 0.125rem 0.375rem; border-radius: 9999px;
  background: rgba(0,0,0,.25); font-size: 0.75rem; font-weight: 600;
}
</style>
