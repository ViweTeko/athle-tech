<script setup lang="ts">
import type { SessionType } from './types'

const date = defineModel<string>('date', { required: true })
const sessionType = defineModel<SessionType>('sessionType', { required: true })
const duration = defineModel<number>('duration', { required: true })

const emit = defineEmits<{
  (e: 'apply'): void
  (e: 'save'): void
}>()
</script>

<template>
  <div class="bg-white p-4 border rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Session Date</label>
        <input v-model="date" type="date" class="px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Session Type</label>
        <select v-model="sessionType" @change="emit('apply')" class="px-3 py-1.5 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500">
          <option value="TRACK">Track Session</option>
          <option value="TEMPO">Tempo Run</option>
          <option value="GYM">Gym / Strength</option>
          <option value="LONG_RUN">Long Run</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Duration (Mins)</label>
        <input
          v-model.number="duration"
          @input="emit('apply')"
          type="number"
          min="10"
          max="180"
          class="w-24 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <button @click="emit('save')" class="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition">
      Save Attendance Log
    </button>
  </div>
</template>