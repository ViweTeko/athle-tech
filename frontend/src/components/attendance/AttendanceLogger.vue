<script setup lang="ts">
import { useAttendance } from './useAttendance'
import SessionSetupBar from './SessionSetupBar.vue'
import AttendanceTableRow from './AttendanceTableRow.vue'

const {
  sessionDate,
  globalSessionType,
  globalDuration,
  attendanceList,
  highRiskCount,
  totalPresent,
  calculateACWR,
  getACWRBadgeClass,
  applyGlobalSettings
} = useAttendance()

function handleSave() {
  console.log('Saving attendance payload to backend:', attendanceList.value)
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <!-- Header Summary -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Attendance & Workload Logger</h1>
        <p class="text-sm text-gray-500">Log daily Session RPE and monitor Acute-to-Chronic Workload Ratio (ACWR)</p>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
          Present: {{ totalPresent }}/{{ attendanceList.length }}
        </span>
        <span
          :class="highRiskCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold"
        >
          ACWR Alert (>1.5): {{ highRiskCount }} Athlete(s)
        </span>
      </div>
    </div>

    <!-- Global Controls Component -->
    <SessionSetupBar
      v-model:date="sessionDate"
      v-model:sessionType="globalSessionType"
      v-model:duration="globalDuration"
      @apply="applyGlobalSettings"
      @save="handleSave"
    />

    <!-- Attendance Grid Table Component -->
    <div class="bg-white border rounded-xl shadow-sm overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <th class="py-3 px-4">Athlete</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Duration</th>
            <th class="py-3 px-4">RPE Scale (1 - 10)</th>
            <th class="py-3 px-4 text-center">ACWR Status</th>
          </tr>
        </thead>
        <tbody>
          <AttendanceTableRow
            v-for="entry in attendanceList"
            :key="entry.athleteId"
            :entry="entry"
            :calculate-a-c-w-r="calculateACWR"
            :get-a-c-w-r-badge-class="getACWRBadgeClass"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>