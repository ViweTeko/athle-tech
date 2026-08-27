<!--
  frontend/src/components/attendance/AttendanceTableRow.vue

  Renders a table row for a single athlete's attendance log entry,
  allowing the user to edit status, duration, and RPE per session.
  Displays the ACWR badge computed from acute and chronic workload values.
-->
<script setup lang="ts">
import type { AttendanceRecord } from './useAttendance'

const props = defineProps<{
  entry: AttendanceRecord
  calculateACWR: (acute: number, chronic: number) => number
  getACWRBadgeClass: (acwr: number) => string
}>()

/** Per-entry acute workload (sRPE) used for badge calculation. */
const acuteLoad = () => props.entry.session_workload ?? props.entry.duration_minutes * props.entry.rpe

function setStatus(status: AttendanceRecord['status']) {
  props.entry.status = status
  if (status !== 'PRESENT') {
    props.entry.rpe = 1
    props.entry.duration_minutes = 0
  }
}
</script>

<template>
  <tr class="hover:bg-gray-50/50 transition border-b border-gray-100">
    <!-- Athlete Details -->
    <td class="py-4 px-4">
      <p class="font-semibold text-gray-900">{{ entry.athlete }}</p>
      <p class="text-xs text-gray-500">{{ entry.session_type }}</p>
    </td>

    <!-- Status Buttons -->
    <td class="py-4 px-4">
      <div class="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          @click="setStatus('PRESENT')"
          :class="entry.status === 'PRESENT' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-2.5 py-1 text-xs font-medium border rounded-l-lg transition"
        >
          Present
        </button>
        <button
          type="button"
          @click="setStatus('ABSENT')"
          :class="entry.status === 'ABSENT' ? 'bg-gray-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-2.5 py-1 text-xs font-medium border-t border-b transition"
        >
          Absent
        </button>
        <button
          type="button"
          @click="setStatus('EXCUSED')"
          :class="entry.status === 'EXCUSED' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-2.5 py-1 text-xs font-medium border rounded-r-lg transition"
        >
          Excused
        </button>
      </div>
    </td>

    <!-- Duration Input -->
    <td class="py-4 px-4">
      <div class="flex items-center gap-1">
        <input
          v-model.number="entry.duration_minutes"
          :disabled="entry.status !== 'PRESENT'"
          type="number"
          class="w-16 px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
        />
        <span class="text-xs text-gray-500">min</span>
      </div>
    </td>

    <!-- RPE Scale Chips -->
    <td class="py-4 px-4">
      <div class="flex gap-1" :class="{ 'opacity-40 pointer-events-none': entry.status !== 'PRESENT' }">
        <button
          v-for="rpeVal in 10"
          :key="rpeVal"
          @click="entry.rpe = rpeVal"
          :class="[
            entry.rpe === rpeVal
              ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            'w-7 h-7 rounded text-xs transition flex items-center justify-center'
          ]"
        >
          {{ rpeVal }}
        </button>
      </div>
    </td>

    <!-- ACWR Badge -->
    <td class="py-4 px-4 text-center">
      <div class="inline-flex flex-col items-center">
        <span
          :class="getACWRBadgeClass(calculateACWR(acuteLoad(), acuteLoad()))"
          class="px-2.5 py-1 rounded-full text-xs font-bold border"
        >
          {{ calculateACWR(acuteLoad(), acuteLoad()) }}
        </span>
        <span
          v-if="calculateACWR(acuteLoad(), acuteLoad()) > 1.5"
          class="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tight"
        >
          High Injury Risk
        </span>
      </div>
    </td>
  </tr>
</template>