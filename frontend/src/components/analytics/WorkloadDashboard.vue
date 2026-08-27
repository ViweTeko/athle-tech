<!--
  frontend/src/components/analytics/WorkloadDashboard.vue

  Team-wide Acute-to-Chronic Workload Ratio (ACWR) and sRPE training load dashboard.
  Aggregates 7-day vs 28-day workload data from PostgreSQL to flag injury risk zones.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Athlete } from '../athletes/types';

interface AttendanceLogItem {
  id: string;
  athlete: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  session_type: string;
  duration_minutes: number;
  rpe: number;
  session_workload: number;
}

interface AthleteWorkloadSummary {
  athlete: Athlete;
  acute7DaySum: number;
  acuteDailyAvg: number;
  chronic28DaySum: number;
  chronicDailyAvg: number;
  acwr: number;
  riskCategory: 'OPTIMAL' | 'ELEVATED' | 'HIGH_RISK' | 'UNDERTRAINED' | 'NO_DATA';
  riskLabel: string;
}

const router = useRouter();
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const athletes = ref<Athlete[]>([]);
const attendanceLogs = ref<AttendanceLogItem[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

/**
 * Fetch athletes and attendance logs concurrently
 */
const loadDashboardData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const [athletesRes, attendanceRes] = await Promise.all([
      fetch(`${API_BASE_URL}/athletes/`),
      fetch(`${API_BASE_URL}/attendance/`),
    ]);

    if (!athletesRes.ok || !attendanceRes.ok) {
      throw new Error('Failed to load analytical data from backend.');
    }

    athletes.value = await athletesRes.json();
    attendanceLogs.value = await attendanceRes.json();
  } catch (err: any) {
    error.value = err.message || 'Error connecting to analytics engine.';
  } finally {
    loading.value = false;
  }
};

/**
 * Process raw attendance data into rolling 7-day and 28-day ACWR metrics
 */
const workloadSummaries = computed<AthleteWorkloadSummary[]>(() => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(now.getDate() - 28);

  return athletes.value.map((athlete) => {
    // Filter present logs within 28-day window for this athlete
    const athleteLogs = attendanceLogs.value.filter((log) => {
      if (log.athlete !== athlete.id || log.status !== 'PRESENT') return false;
      const logDate = new Date(log.date);
      return logDate >= twentyEightDaysAgo && logDate <= now;
    });

    // 7-day Acute Load
    const acuteLogs = athleteLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);
    const acute7DaySum = acuteLogs.reduce(
      (sum, l) => sum + (l.session_workload || l.duration_minutes * l.rpe),
      0
    );
    const acuteDailyAvg = Math.round(acute7DaySum / 7);

    // 28-day Chronic Load
    const chronic28DaySum = athleteLogs.reduce(
      (sum, l) => sum + (l.session_workload || l.duration_minutes * l.rpe),
      0
    );
    const chronicDailyAvg = Math.round(chronic28DaySum / 28);

    // ACWR Calculation
    let acwr = 0;
    let riskCategory: AthleteWorkloadSummary['riskCategory'] = 'NO_DATA';
    let riskLabel = 'No Recent Data';

    if (chronicDailyAvg > 0) {
      acwr = Number((acuteDailyAvg / chronicDailyAvg).toFixed(2));

      if (acwr < 0.8) {
        riskCategory = 'UNDERTRAINED';
        riskLabel = 'Under-trained (< 0.8)';
      } else if (acwr <= 1.3) {
        riskCategory = 'OPTIMAL';
        riskLabel = 'Sweet Spot (0.8 - 1.3)';
      } else if (acwr <= 1.5) {
        riskCategory = 'ELEVATED';
        riskLabel = 'Elevated Risk (1.3 - 1.5)';
      } else {
        riskCategory = 'HIGH_RISK';
        riskLabel = 'High Injury Risk (> 1.5)';
      }
    } else if (acute7DaySum > 0) {
      acwr = 2.0;
      riskCategory = 'HIGH_RISK';
      riskLabel = 'Workload Spike (> 1.5)';
    }

    return {
      athlete,
      acute7DaySum,
      acuteDailyAvg,
      chronic28DaySum,
      chronicDailyAvg,
      acwr,
      riskCategory,
      riskLabel,
    };
  });
});

/**
 * Top-level analytical summary statistics
 */
const highRiskCount = computed(() => {
  return workloadSummaries.value.filter((s) => s.riskCategory === 'HIGH_RISK').length;
});

const optimalCount = computed(() => {
  return workloadSummaries.value.filter((s) => s.riskCategory === 'OPTIMAL').length;
});

const totalTeamWorkload7Days = computed(() => {
  return workloadSummaries.value.reduce((sum, s) => sum + s.acute7DaySum, 0);
});

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="workload-dashboard max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100">Workload &amp; Injury Risk Intelligence</h1>
        <p class="text-xs text-slate-400">
          Gabbett ACWR Model monitoring Acute (7-day) vs. Chronic (28-day) sRPE training stress.
        </p>
      </div>
      <button
        @click="router.push('/attendance')"
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-md"
      >
        <span>⚡</span> Log Session
      </button>
    </div>

    <!-- Error Banner -->
    <div
      v-if="error"
      class="bg-rose-900/50 border border-rose-700 text-rose-200 p-4 rounded-xl flex justify-between items-center text-sm"
    >
      <span>{{ error }}</span>
      <button @click="loadDashboardData" class="underline hover:text-white font-semibold">Retry</button>
    </div>

    <!-- Metric KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- High Risk Alert Card -->
      <div
        class="bg-slate-800 border p-5 rounded-2xl shadow-sm flex flex-col justify-between"
        :class="highRiskCount > 0 ? 'border-rose-500/80 bg-rose-950/20' : 'border-slate-700'"
      >
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Athletes</span>
          <div class="flex items-baseline gap-2 mt-2">
            <span
              class="text-3xl font-extrabold font-mono"
              :class="highRiskCount > 0 ? 'text-rose-400' : 'text-slate-100'"
            >
              {{ highRiskCount }}
            </span>
            <span class="text-xs text-slate-400">/ {{ athletes.length }} total</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-3">ACWR &gt; 1.5 or rapid chronic spikes</p>
      </div>

      <!-- Optimal Load Card -->
      <div class="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optimal Sweet Spot</span>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-3xl font-extrabold font-mono text-emerald-400">{{ optimalCount }}</span>
            <span class="text-xs text-slate-400">athletes</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-3">ACWR between 0.8 and 1.3</p>
      </div>

      <!-- 7-Day Cumulative Squad Load -->
      <div class="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">7-Day Squad Workload</span>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-3xl font-extrabold font-mono text-sky-400">
              {{ totalTeamWorkload7Days.toLocaleString() }}
            </span>
            <span class="text-xs text-slate-400">AU</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-3">Cumulative sRPE arbitrary units</p>
      </div>

      <!-- Active Squad Count -->
      <div class="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Roster Size</span>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-3xl font-extrabold font-mono text-slate-100">{{ athletes.length }}</span>
            <span class="text-xs text-slate-400">monitored</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-3">PostgreSQL synchronised profiles</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && athletes.length === 0" class="text-center py-16 text-slate-400">
      Computing rolling ACWR ratios from training logs...
    </div>

    <!-- Workload Intelligence Table -->
    <div v-else class="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 class="text-base font-bold text-slate-100">Squad Workload Roster</h2>
          <p class="text-xs text-slate-400">Individual Acute:Chronic load scores and risk categorisation.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th class="py-3 px-4">Athlete</th>
              <th class="py-3 px-4">Event Discipline</th>
              <th class="py-3 px-4">7-Day Load (AU)</th>
              <th class="py-3 px-4">28-Day Avg (AU/day)</th>
              <th class="py-3 px-4">ACWR Ratio</th>
              <th class="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/60">
            <tr
              v-for="item in workloadSummaries"
              :key="item.athlete.id"
              class="hover:bg-slate-700/30 transition-colors"
            >
              <!-- Athlete Name -->
              <td class="py-4 px-4 font-semibold text-slate-100">
                {{ item.athlete.first_name }} {{ item.athlete.last_name }}
              </td>

              <!-- Primary Event -->
              <td class="py-4 px-4 text-xs font-mono text-slate-400">
                {{ item.athlete.primary_event }}
              </td>

              <!-- 7-Day Acute Workload -->
              <td class="py-4 px-4 font-mono font-medium text-slate-200">
                {{ item.acute7DaySum.toLocaleString() }}
                <span class="text-xs text-slate-500 block">({{ item.acuteDailyAvg }}/day)</span>
              </td>

              <!-- 28-Day Chronic Workload -->
              <td class="py-4 px-4 font-mono font-medium text-slate-200">
                {{ item.chronicDailyAvg }}
                <span class="text-xs text-slate-500 block">({{ item.chronic28DaySum.toLocaleString() }} sum)</span>
              </td>

              <!-- ACWR Value -->
              <td class="py-4 px-4 font-mono font-bold text-base">
                <span
                  :class="{
                    'text-rose-400': item.riskCategory === 'HIGH_RISK',
                    'text-emerald-400': item.riskCategory === 'OPTIMAL',
                    'text-amber-400': item.riskCategory === 'ELEVATED',
                    'text-sky-400': item.riskCategory === 'UNDERTRAINED',
                    'text-slate-500': item.riskCategory === 'NO_DATA',
                  }"
                >
                  {{ item.acwr > 0 ? item.acwr : '-' }}
                </span>
              </td>

              <!-- Risk Badge -->
              <td class="py-4 px-4 text-center">
                <span
                  class="inline-block px-3 py-1 rounded-full text-xs font-semibold border"
                  :class="{
                    'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse':
                      item.riskCategory === 'HIGH_RISK',
                    'bg-emerald-950/80 text-emerald-300 border-emerald-800':
                      item.riskCategory === 'OPTIMAL',
                    'bg-amber-950/80 text-amber-300 border-amber-800':
                      item.riskCategory === 'ELEVATED',
                    'bg-sky-950/80 text-sky-300 border-sky-800':
                      item.riskCategory === 'UNDERTRAINED',
                    'bg-slate-900 text-slate-400 border-slate-700':
                      item.riskCategory === 'NO_DATA',
                  }"
                >
                  {{ item.riskLabel }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>