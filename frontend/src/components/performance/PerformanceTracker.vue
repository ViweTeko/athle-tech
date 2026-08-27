<!--
  frontend/src/components/performance/PerformanceTracker.vue

  Shell view component for Screen 3, combining the ResultEntryForm and
  grid of PerformanceCard instances to track athletes' benchmark achievements.
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePerformance } from './usePerformance'
import ResultEntryForm from './ResultEntryForm.vue'
import PerformanceCard from './PerformanceCard.vue'

const {
  performances,
  loading,
  error,
  fetchPerformances,
  addPerformance,
  formatSecondsToTime,
  calculateDelta,
} = usePerformance()

onMounted(() => fetchPerformances())
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Performance &amp; Delta Tracker</h1>
      <p class="text-sm text-gray-500">Track race results and measure time gaps against ASA national qualifying standards</p>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Entry Form -->
    <ResultEntryForm @add-result="addPerformance" />

    <!-- Loading State -->
    <div v-if="loading && !performances.length" class="text-center py-8 text-gray-400 text-sm">
      Loading performance records...
    </div>

    <!-- Cards Grid -->
    <div v-else-if="performances.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PerformanceCard
        v-for="res in performances"
        :key="res.id"
        :result="res"
        :format-seconds-to-time="formatSecondsToTime"
        :calculate-delta="calculateDelta"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
      No performance records yet. Log the first race result above.
    </div>
  </div>
</template>