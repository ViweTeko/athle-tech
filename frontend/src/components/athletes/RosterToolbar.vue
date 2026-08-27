<!--
  frontend/src/components/athletes/RosterToolbar.vue

  Provides controls for searching athletes and filtering by both roster status
  and primary event disciplines (Sprints, Middle, Long, Hurdles, Jumps, Throws).
  Emits v-model-compatible events for two-way binding.
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { StatusFilter, EventFilter, AthleteStats } from './useAthletes';

const props = defineProps<{
  searchQuery: string;
  selectedStatus: StatusFilter;
  selectedEvent: EventFilter;
  stats: AthleteStats;
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:selectedStatus', val: StatusFilter): void;
  (e: 'update:selectedEvent', val: EventFilter): void;
}>();

const searchVal = computed({
  get() { return props.searchQuery; },
  set(val) { emit('update:searchQuery', val); },
});

function setStatus(status: StatusFilter) {
  emit('update:selectedStatus', status);
}

function setEvent(event: EventFilter) {
  emit('update:selectedEvent', event);
}
</script>

<template>
  <section class="roster-toolbar space-y-4">
    <!-- Top Row: Search Input & Status Filters -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- Search Box -->
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
        <button
          v-if="searchVal"
          class="clear-search"
          @click="searchVal = ''"
          title="Clear search"
        >
          &times;
        </button>
      </div>

      <!-- Status Filter Pills -->
      <div class="filter-pills" role="tablist" aria-label="Status filter">
        <button
          class="pill-btn"
          :class="{ active: selectedStatus === 'ALL' }"
          @click="setStatus('ALL')"
          role="tab"
          :aria-selected="selectedStatus === 'ALL'"
        >
          All Statuses <span class="pill-count">{{ stats.total }}</span>
        </button>
        <button
          class="pill-btn pill-active"
          :class="{ active: selectedStatus === 'ACTIVE' }"
          @click="setStatus('ACTIVE')"
          role="tab"
          :aria-selected="selectedStatus === 'ACTIVE'"
        >
          Active <span class="pill-count">{{ stats.active }}</span>
        </button>
        <button
          class="pill-btn pill-injured"
          :class="{ active: selectedStatus === 'INJURED' }"
          @click="setStatus('INJURED')"
          role="tab"
          :aria-selected="selectedStatus === 'INJURED'"
        >
          Injured <span class="pill-count">{{ stats.injured }}</span>
        </button>
        <button
          class="pill-btn pill-resting"
          :class="{ active: selectedStatus === 'RESTING' }"
          @click="setStatus('RESTING')"
          role="tab"
          :aria-selected="selectedStatus === 'RESTING'"
        >
          Resting <span class="pill-count">{{ stats.resting }}</span>
        </button>
      </div>
    </div>

    <!-- Bottom Row: Event Discipline Filter Pills -->
    <div class="event-filter-bar pt-2 border-t border-slate-800">
      <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Discipline Filter</span>
      <div class="filter-pills" role="tablist" aria-label="Discipline filter">
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'ALL' }"
          @click="setEvent('ALL')"
          role="tab"
          :aria-selected="selectedEvent === 'ALL'"
        >
          All Events <span class="pill-count">{{ stats.total }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'SPRINTS' }"
          @click="setEvent('SPRINTS')"
          role="tab"
          :aria-selected="selectedEvent === 'SPRINTS'"
        >
          Sprints <span class="pill-count">{{ stats.sprints }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'MIDDLE' }"
          @click="setEvent('MIDDLE')"
          role="tab"
          :aria-selected="selectedEvent === 'MIDDLE'"
        >
          Middle Distance <span class="pill-count">{{ stats.middle }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'LONG' }"
          @click="setEvent('LONG')"
          role="tab"
          :aria-selected="selectedEvent === 'LONG'"
        >
          Long Distance <span class="pill-count">{{ stats.long }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'HURDLES' }"
          @click="setEvent('HURDLES')"
          role="tab"
          :aria-selected="selectedEvent === 'HURDLES'"
        >
          Hurdles <span class="pill-count">{{ stats.hurdles }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'JUMPS' }"
          @click="setEvent('JUMPS')"
          role="tab"
          :aria-selected="selectedEvent === 'JUMPS'"
        >
          Jumps <span class="pill-count">{{ stats.jumps }}</span>
        </button>
        <button
          class="pill-btn"
          :class="{ active: selectedEvent === 'THROWS' }"
          @click="setEvent('THROWS')"
          role="tab"
          :aria-selected="selectedEvent === 'THROWS'"
        >
          Throws <span class="pill-count">{{ stats.throws }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.roster-toolbar {
  background: rgba(15, 23, 42, 0.8);
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
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

.clear-search:hover {
  color: #f8fafc;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.875rem;
  border-radius: 9999px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.8125rem;
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

.pill-active.active {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.pill-injured.active {
  background: #f43f5e;
  border-color: #f43f5e;
  color: #fff;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.pill-resting.active {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.pill-count {
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.6875rem;
  font-weight: 600;
}
</style>