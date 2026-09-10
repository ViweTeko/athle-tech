<!-- frontend/src/components/performance/PerformanceCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { RacePerformanceRecord } from './types';
import { formatPerformanceValue } from './usePerformance';

const props = defineProps<{
  record: RacePerformanceRecord;
}>();

const eventLabel = computed(() => {
  return props.record?.event_name ? props.record.event_name.toUpperCase() : 'EVENT';
});

const isQualifying = computed(() => {
  return props.record.delta_seconds <= 0;
});
</script>

<template>
  <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition-all shadow-md flex flex-col justify-between">
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-slate-900 text-indigo-300 border border-slate-700">
          {{ eventLabel }}
        </span>

        <span
          v-if="isQualifying"
          class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800"
        >
          ASA Q
        </span>
      </div>

      <!-- Mark & Delta -->
      <div class="my-3">
        <div class="text-3xl font-extrabold text-white tracking-tight font-mono">
          {{ formatPerformanceValue(record.recorded_time_seconds) }}
        </div>
        
        <div class="text-xs mt-2 flex items-center gap-1.5 text-slate-400">
          <span>Target: {{ formatPerformanceValue(record.asa_standard_seconds) }}</span>
          <span :class="isQualifying ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'">
            ({{ record.delta_seconds > 0 ? `+${record.delta_seconds.toFixed(2)}` : record.delta_seconds.toFixed(2) }}s)
          </span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pt-3 mt-3 border-t border-slate-700/60 text-xs text-slate-400 flex justify-between items-center">
      <span class="font-medium text-slate-300">{{ record.date }}</span>
    </div>
  </div>
</template>