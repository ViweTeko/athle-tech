<script setup lang="ts">
/**
 * @fileoverview PerformanceTracker component.
 * Shell view component for Screen 3, combining the ResultEntryForm and
 * grid of PerformanceCard instances to track athletes' benchmark achievements.
 */

import { usePerformance } from './usePerformance'
import ResultEntryForm from './ResultEntryForm.vue'
import PerformanceCard from './PerformanceCard.vue'

const { results, formatSecondsToTime, calculateDelta, addResult } = usePerformance()
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Performance & Delta Tracker</h1>
      <p class="text-sm text-gray-500">Track race results and measure time gaps against ASA national qualifying standards</p>
    </div>

    <!-- Form -->
    <ResultEntryForm @add-result="addResult" />

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PerformanceCard
        v-for="res in results"
        :key="res.id"
        :result="res"
        :format-seconds-to-time="formatSecondsToTime"
        :calculate-delta="calculateDelta"
      />
    </div>
  </div>
</template>