<!--
  frontend/src/components/performance/PerformanceCard.vue

  Displays a single race performance result, comparing the recorded time against
  the ASA national qualifying standard and visualizing proximity on a progress bar.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { RacePerformanceRecord } from './usePerformance'

const props = defineProps<{
  result: RacePerformanceRecord
  formatSecondsToTime: (secs: number) => string
  calculateDelta: (rec: number, target: number) => { seconds: string; percentage: number }
}>()

const delta = computed(() =>
  props.calculateDelta(props.result.recorded_time_seconds, props.result.asa_standard_seconds)
)
</script>

<template>
  <div class="bg-white border rounded-xl p-5 shadow-sm space-y-3 hover:shadow-md transition">
    <div class="flex justify-between items-start">
      <div>
        <h4 class="font-bold text-gray-900 text-base">{{ result.athlete }}</h4>
        <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {{ result.event_name }} • {{ result.date }}
        </span>
      </div>

      <div class="text-right">
        <span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
          Gap: {{ delta.seconds }}
        </span>
      </div>
    </div>

    <!-- Times Grid -->
    <div class="grid grid-cols-2 gap-2 text-xs pt-2">
      <div>
        <p class="text-gray-400 font-medium">Recorded Time</p>
        <p class="text-base font-bold text-gray-900">{{ formatSecondsToTime(result.recorded_time_seconds) }}</p>
      </div>
      <div>
        <p class="text-gray-400 font-medium">ASA National Benchmark</p>
        <p class="text-base font-bold text-gray-600">{{ formatSecondsToTime(result.asa_standard_seconds) }}</p>
      </div>
    </div>

    <!-- Progress Bar towards ASA Standard -->
    <div class="space-y-1 pt-1">
      <div class="flex justify-between text-xs font-semibold">
        <span class="text-gray-500">Benchmark Proximity</span>
        <span class="text-blue-600">{{ delta.percentage }}%</span>
      </div>
      <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div
          class="bg-blue-600 h-full rounded-full transition-all duration-500"
          :style="{ width: `${delta.percentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>