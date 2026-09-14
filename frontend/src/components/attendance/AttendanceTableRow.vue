<!--
  @fileoverview Table row component for session attendance and sRPE logging.
  @module frontend/src/components/attendance/AttendanceTableRow.vue
-->
<script setup lang="ts">
import type { AttendanceRecord } from './useAttendance';

const props = defineProps<{
  entry: AttendanceRecord;
  calculateACWR: (acute: number, chronic: number) => number;
  getACWRBadgeClass: (acwr: number) => string;
}>();

const acuteLoad = () => props.entry.session_workload ?? props.entry.duration_minutes * props.entry.rpe;

function setStatus(status: AttendanceRecord['status']) {
  props.entry.status = status;
  if (status !== 'PRESENT') {
    props.entry.rpe = 1;
    props.entry.duration_minutes = 0;
  }
}
</script>

<template>
  <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/80">
    <td class="py-4 px-4">
      <p class="font-semibold text-slate-100">{{ entry.athlete }}</p>
      <p class="text-xs text-slate-400">{{ entry.session_type }}</p>
    </td>

    <td class="py-4 px-4">
      <div class="inline-flex rounded-lg shadow-sm border border-slate-700 bg-slate-900 overflow-hidden" role="group">
        <button
          type="button"
          @click="setStatus('PRESENT')"
          :class="entry.status === 'PRESENT' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
          class="px-2.5 py-1.5 text-xs font-medium transition"
        >
          Present
        </button>
        <button
          type="button"
          @click="setStatus('ABSENT')"
          :class="entry.status === 'ABSENT' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'"
          class="px-2.5 py-1.5 text-xs font-medium border-x border-slate-700 transition"
        >
          Absent
        </button>
        <button
          type="button"
          @click="setStatus('EXCUSED')"
          :class="entry.status === 'EXCUSED' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
          class="px-2.5 py-1.5 text-xs font-medium transition"
        >
          Excused
        </button>
      </div>
    </td>

    <td class="py-4 px-4">
      <div class="flex items-center gap-1.5">
        <input
          v-model.number="entry.duration_minutes"
          :disabled="entry.status !== 'PRESENT'"
          type="number"
          class="w-16 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono disabled:opacity-40"
        />
        <span class="text-xs text-slate-400 font-mono">min</span>
      </div>
    </td>

    <td class="py-4 px-4">
      <div class="flex gap-1" :class="{ 'opacity-30 pointer-events-none': entry.status !== 'PRESENT' }">
        <button
          v-for="rpeVal in 10"
          :key="rpeVal"
          @click="entry.rpe = rpeVal"
          :class="[
            entry.rpe === rpeVal
              ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700/60',
            'w-7 h-7 rounded text-xs transition flex items-center justify-center font-mono'
          ]"
        >
          {{ rpeVal }}
        </button>
      </div>
    </td>

    <td class="py-4 px-4 text-center">
      <div class="inline-flex flex-col items-center">
        <span
          :class="getACWRBadgeClass(calculateACWR(acuteLoad(), acuteLoad()))"
          class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border"
        >
          {{ calculateACWR(acuteLoad(), acuteLoad()) }}
        </span>
      </div>
    </td>
  </tr>
</template>