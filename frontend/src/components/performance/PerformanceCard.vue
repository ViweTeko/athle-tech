<!-- frontend/src/performance/PerformanceCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { RacePerformanceRecord } from './types';
import { isFieldEvent, formatPerformanceValue, ASA_SENIOR_STANDARDS_MALE } from './usePerformance';

const props = defineProps<{
  record: RacePerformanceRecord;
}>();

const isField = computed(() => isFieldEvent(props.record.event));
const asaBenchmark = computed(() => ASA_SENIOR_STANDARDS_MALE[props.record.event]);

const asaDelta = computed(() => {
  if (asaBenchmark.value === undefined) return null;
  const delta = props.record.result_value - asaBenchmark.value;
  return Number(delta.toFixed(2));
});

const qualifiesAsa = computed(() => {
  if (asaBenchmark.value === undefined) return false;
  return isField.value
    ? props.record.result_value >= asaBenchmark.value
    : props.record.result_value <= asaBenchmark.value;
});
</script>

<template>
  <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition-all shadow-md flex flex-col justify-between">
    <div>
      <!-- Header / Badges -->
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-slate-900 text-indigo-300 border border-slate-700">
          {{ record.event.replace('_', ' ') }}
        </span>

        <div class="flex items-center gap-1.5">
          <span
            v-if="record.is_personal_best"
            class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800"
          >
            ★ PB
          </span>
          <span
            v-if="qualifiesAsa"
            class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800"
          >
            ASA Q
          </span>
        </div>
      </div>

      <!-- Mark & Delta Readout -->
      <div class="my-3">
        <div class="text-3xl font-extrabold text-white tracking-tight font-mono">
          {{ formatPerformanceValue(record.result_value, record.event) }}
        </div>
        
        <!-- ASA Delta Pill -->
        <div v-if="asaBenchmark !== undefined" class="text-xs mt-2 flex items-center gap-1.5 text-slate-400">
          <span>ASA Benchmark: {{ formatPerformanceValue(asaBenchmark, record.event) }}</span>
          <span
            :class="qualifiesAsa ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'"
          >
            ({{ (asaDelta ?? 0) > 0 ? `+${asaDelta}` : `${asaDelta}` }}{{ isField ? 'm' : 's' }})
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Metadata -->
    <div class="pt-3 mt-3 border-t border-slate-700/60 text-xs text-slate-400 flex justify-between items-center">
      <div class="truncate mr-2">
        <span class="font-medium text-slate-300 block">{{ record.competition_name }}</span>
        <span>{{ record.competition_date }}</span>
      </div>
      <div v-if="record.wind_reading !== undefined && record.wind_reading !== null" class="font-mono text-slate-500">
        {{ (record.wind_reading > 0 ? `+${record.wind_reading}` : record.wind_reading) }} m/s
      </div>
    </div>
  </div>
</template>