<!--
  frontend/src/components/attendance/AttendanceLogger.vue

  Main view component for logging daily athlete attendance, training session details,
  and monitoring active injury risks via the ACWR index.
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAttendance } from './useAttendance'
import SessionSetupBar from './SessionSetupBar.vue'
import AttendanceTableRow from './AttendanceTableRow.vue'

const {
  logs,
  loading,
  error,
  sessionDate,
  globalSessionType,
  globalDuration,
  totalPresent,
  highRiskCount,
  calculateACWR,
  getACWRBadgeClass,
  applyGlobalSettings,
  fetchLogs,
  logAttendance,
} = useAttendance()

onMounted(() => fetchLogs())

/** Persist all locally modified log entries back to the backend. */
async function handleSave() {
  for (const entry of logs.value) {
    await logAttendance({
      athlete: entry.athlete,
      date: entry.date,
      status: entry.status,
      session_type: entry.session_type,
      duration_minutes: entry.duration_minutes,
      rpe: entry.rpe,
    })
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <!-- Header Summary -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Attendance &amp; Workload Logger</h1>
        <p class="text-sm text-gray-500">Log daily Session RPE and monitor Acute-to-Chronic Workload Ratio (ACWR)</p>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
          Present: {{ totalPresent }}/{{ logs.length }}
        </span>
        <span
          :class="highRiskCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold"
        >
          ACWR Alert (&gt;1.5): {{ highRiskCount }} Athlete(s)
        </span>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading && !logs.length" class="text-center py-8 text-gray-400 text-sm">
      Loading attendance records...
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
            v-for="entry in logs"
            :key="entry.id ?? entry.athlete"
            :entry="entry"
            :calculate-a-c-w-r="calculateACWR"
            :get-a-c-w-r-badge-class="getACWRBadgeClass"
          />
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="!loading && !logs.length" class="text-center py-8 text-gray-400 text-sm">
        No attendance records found. Fetch logs or add a session above.
      </div>
    </div>
  </div>
</template>