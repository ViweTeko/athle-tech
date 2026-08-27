<!--
  frontend/src/components/performance/ResultEntryForm.vue

  Renders a form input grid allowing users to submit a race performance result.
  Emits add-result with an Omit<RacePerformanceRecord, 'id' | 'delta_seconds'> payload
  so the parent can post it to the Django REST API via addPerformance.
-->
<script setup lang="ts">
import { ref } from 'vue'
import type { RacePerformanceRecord } from './usePerformance'

const emit = defineEmits<{
  (e: 'add-result', payload: Omit<RacePerformanceRecord, 'id' | 'delta_seconds'>): void
}>()

const athleteId = ref('')
const eventName = ref<RacePerformanceRecord['event_name']>('800m')
const date = ref(new Date().toISOString().split('T')[0])
const recordedTimeSeconds = ref<number | null>(null)
const asaStandardSeconds = ref<number | null>(null)

function handleSubmit() {
  if (!athleteId.value || !recordedTimeSeconds.value || !asaStandardSeconds.value) return

  emit('add-result', {
    athlete: athleteId.value,
    event_name: eventName.value,
    date: date.value,
    recorded_time_seconds: recordedTimeSeconds.value,
    asa_standard_seconds: asaStandardSeconds.value,
  })

  // Reset form
  athleteId.value = ''
  recordedTimeSeconds.value = null
  asaStandardSeconds.value = null
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="bg-white p-5 border rounded-xl shadow-sm space-y-4">
    <h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Log New Race Performance</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Athlete UUID</label>
        <input
          v-model="athleteId"
          type="text"
          placeholder="Paste athlete UUID"
          required
          class="w-full px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Event</label>
        <select v-model="eventName" class="w-full px-3 py-1.5 border rounded-md bg-white focus:ring-2 focus:ring-blue-500">
          <option value="100m">100m</option>
          <option value="200m">200m</option>
          <option value="400m">400m</option>
          <option value="800m">800m</option>
          <option value="1500m">1500m</option>
          <option value="5000m">5000m</option>
          <option value="10km">10km</option>
          <option value="21.1km">21.1km</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Race Date</label>
        <input v-model="date" type="date" required class="w-full px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Recorded Time (Secs)</label>
        <input
          v-model.number="recordedTimeSeconds"
          type="number"
          step="0.01"
          placeholder="112.40"
          required
          class="w-full px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">ASA Target (Secs)</label>
        <input
          v-model.number="asaStandardSeconds"
          type="number"
          step="0.01"
          placeholder="108.00"
          required
          class="w-full px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="flex justify-end">
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition">
        Log Performance
      </button>
    </div>
  </form>
</template>