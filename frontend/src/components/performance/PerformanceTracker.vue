<!-- frontend/src/components/performance/PerformanceTracker.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePerformance } from './usePerformance';
import PerformanceCard from './PerformanceCard.vue';
import ResultEntryForm from './ResultEntryForm.vue';
import ASAGapReport from '../../analytics/ASAGapReport.vue';
import { apiFetch } from '../../utils/api';

const { performances, loading, error, fetchPerformances, createPerformance } = usePerformance();

const athletes = ref<Array<{ id: string; first_name: string; last_name: string; primary_event: string }>>([]);
const selectedEventFilter = ref<string>('ALL');
const gapReportRef = ref<InstanceType<typeof ASAGapReport> | null>(null);

const eventFilters = ['ALL', '100m', '200m', '400m', '800m', '1500m', '5000m', '10km', '21.1km'];

const fetchAthletes = async () => {
  try {
    athletes.value = await apiFetch<Array<{ id: string; first_name: string; last_name: string; primary_event: string }>>('/athletes/');
  } catch (err) {
    console.error('Failed to load athletes for dropdown', err);
  }
};

const filteredPerformances = computed(() => {
  if (selectedEventFilter.value === 'ALL') return performances.value;
  return performances.value.filter((p) => p.event_name.toLowerCase() === selectedEventFilter.value.toLowerCase());
});

const handleResultSubmit = async (payload: any) => {
  await createPerformance(payload);
};

onMounted(async () => {
  await Promise.all([fetchPerformances(), fetchAthletes()]);
});
</script>

<template>
  <div class="performance-tracker max-w-6xl mx-auto space-y-6">
    <!-- Top Bar & Event Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <div>
        <h2 class="text-xl font-bold text-white tracking-tight">Performance & EPA / ASA Standards Tracker</h2>
        <p class="text-xs text-slate-400 mt-0.5">Track multi-event competition personal bests and qualification deltas.</p>
      </div>

      <!-- Filter Pills -->
      <div class="flex flex-wrap gap-1.5 text-xs">
        <button
          v-for="filter in eventFilters"
          :key="filter"
          @click="selectedEventFilter = filter"
          :class="[
            'px-3 py-1.5 rounded-lg font-semibold transition-all border',
            selectedEventFilter === filter
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs">
      {{ error }}
    </div>

    <!-- EPA / ASA Qualification Standards Gap Report -->
    <ASAGapReport ref="gapReportRef" />

    <!-- Form Section -->
    <ResultEntryForm
      :athletes="athletes"
      :loading="loading"
      @submit="handleResultSubmit"
    />

    <!-- Results Grid -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Recorded Results ({{ filteredPerformances.length }})
        </h3>
      </div>

      <div v-if="loading && filteredPerformances.length === 0" class="text-center py-12 text-slate-500 text-xs">
        Loading race records...
      </div>

      <div v-else-if="filteredPerformances.length === 0" class="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
        No performance marks recorded for this selection yet.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PerformanceCard
          v-for="record in filteredPerformances"
          :key="record.id"
          :record="record"
        />
      </div>
    </div>
  </div>
</template>