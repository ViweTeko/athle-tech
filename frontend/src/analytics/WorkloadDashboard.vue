<!--
  @fileoverview Screen Component: Workload Analytics & ACWR Dashboard.
  @module frontend/src/analytics/WorkloadDashboard.vue

  Renders the ACWR risk dial, acute/chronic metric breakdown cards,
  injury risk recommendation banners, and a 28-day workload bar chart.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAnalytics } from './useAnalytics';
import { apiFetch } from '../utils/api';

interface AthleteOption {
  id: string;
  first_name: string;
  last_name: string;
  primary_event: string;
}

const { analyticsData, loading, error, fetchAthleteAnalytics } = useAnalytics();

const athletes = ref<AthleteOption[]>([]);
const selectedAthleteId = ref<string>('');

const fetchAthletesList = async (): Promise<void> => {
  try {
    const data = await apiFetch<AthleteOption[]>('/athletes/');
    athletes.value = data;
    if (athletes.value.length > 0) {
      selectedAthleteId.value = athletes.value[0].id;
      await fetchAthleteAnalytics(selectedAthleteId.value);
    }
  } catch (err) {
    console.error('Failed to load athlete list for analytics:', err);
  }
};

const handleAthleteSelect = (): void => {
  if (selectedAthleteId.value) {
    fetchAthleteAnalytics(selectedAthleteId.value);
  }
};

// ACWR Needle Coordinate Geometry (0.0 -> 2.0 mapped to 180° -> 0°)
const needleCoordinates = computed(() => {
  const acwr = analyticsData.value?.metrics.acwr ?? 0;
  const clamped = Math.min(Math.max(acwr, 0), 2.0);
  const angle = 180 - (clamped / 2.0) * 180;
  const rad = (angle * Math.PI) / 180;

  return {
    x: 50 + 32 * Math.cos(rad),
    y: 50 - 32 * Math.sin(rad),
  };
});

const statusBadgeClass = computed(() => {
  const status = analyticsData.value?.metrics.status;
  switch (status) {
    case 'UNDERTRAINED':
      return 'bg-blue-950/80 text-blue-300 border-blue-800';
    case 'SWEET_SPOT':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    case 'HIGH_RISK':
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    case 'EXTREME_RISK':
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
});

const maxBarWorkload = computed(() => {
  if (!analyticsData.value?.daily_trend?.length) return 1000;
  const maxVal = Math.max(...analyticsData.value.daily_trend.map((d) => d.workload));
  return Math.max(maxVal, 800);
});

onMounted(() => {
  fetchAthletesList();
});
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Top Header Bar -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 shadow-lg">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <span class="text-amber-400">⚡</span> ACWR Workload Analytics
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">Continuous 28-day training load telemetry and injury risk evaluation.</p>
      </div>

      <!-- Athlete Selection Dropdown -->
      <div class="flex items-center gap-3">
        <label class="text-xs font-semibold text-slate-300">Athlete:</label>
        <select
          v-model="selectedAthleteId"
          @change="handleAthleteSelect"
          class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
        >
          <option v-for="a in athletes" :key="a.id" :value="a.id">
            {{ a.first_name }} {{ a.last_name }} ({{ a.primary_event }})
          </option>
        </select>
        <button
          @click="handleAthleteSelect"
          class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-lg text-xs transition-colors"
          :disabled="loading"
        >
          {{ loading ? '...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <!-- Error State -->
    <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-4 rounded-xl">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading && !analyticsData" class="py-20 text-center text-slate-400 text-xs">
      Querying rolling window telemetry from PostgreSQL...
    </div>

    <!-- Main Dashboard Metrics -->
    <div v-else-if="analyticsData" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        <!-- ACWR Gauge Card -->
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-lg">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Acute : Chronic Ratio (ACWR)
          </span>

          <div class="relative w-52 h-32 my-4">
            <svg class="w-full h-full" viewBox="0 0 100 55">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" stroke-width="10" stroke-linecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 30 18" fill="none" stroke="#3b82f6" stroke-width="10" />
              <path d="M 30 18 A 40 40 0 0 1 70 18" fill="none" stroke="#10b981" stroke-width="10" />
              <path d="M 70 18 A 40 40 0 0 1 82 30" fill="none" stroke="#f59e0b" stroke-width="10" />
              <path d="M 82 30 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" stroke-width="10" />
              <line
                x1="50"
                y1="50"
                :x2="needleCoordinates.x"
                :y2="needleCoordinates.y"
                stroke="#ffffff"
                stroke-width="3.5"
                stroke-linecap="round"
                class="transition-all duration-700 ease-out"
              />
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <div class="text-4xl font-black text-white font-mono tracking-tight">
              {{ analyticsData.metrics.acwr.toFixed(2) }}
            </div>
            <div
              class="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border tracking-wide"
              :class="statusBadgeClass"
            >
              {{ analyticsData.metrics.status_label }}
            </div>
          </div>
        </div>

        <!-- Metric Details & Recommendations -->
        <div class="lg:col-span-2 flex flex-col justify-between gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Acute Workload -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Acute Workload</span>
                <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  7-Day Fatigue
                </span>
              </div>
              <div class="text-3xl font-extrabold text-white font-mono mt-3">
                {{ analyticsData.metrics.acute_workload }} <span class="text-xs font-normal text-slate-400">AU/day</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-2">Rolling 7-day average daily training load.</p>
            </div>

            <!-- Chronic Workload -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronic Workload</span>
                <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                  28-Day Fitness
                </span>
              </div>
              <div class="text-3xl font-extrabold text-white font-mono mt-3">
                {{ analyticsData.metrics.chronic_workload }} <span class="text-xs font-normal text-slate-400">AU/day</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-2">Rolling 28-day baseline conditioning capacity.</p>
            </div>
          </div>

          <!-- Insight Box -->
          <div class="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex items-start gap-3.5 shadow-lg flex-1">
            <span class="text-2xl">📋</span>
            <div class="text-xs text-slate-300 leading-relaxed space-y-1">
              <strong class="text-white font-semibold block text-sm">Automated Sports Science Protocol:</strong>
              <div v-if="analyticsData.metrics.status === 'SWEET_SPOT'" class="text-emerald-300">
                Optimal training zone (0.8–1.3). Low risk of soft-tissue injury with progressive fitness accumulation. Maintain planned set volume.
              </div>
              <div v-else-if="analyticsData.metrics.status === 'UNDERTRAINED'" class="text-blue-300">
                Under-trained zone (&lt; 0.8). Athlete is safe from acute fatigue injury but is losing discipline-specific aerobic/neuromuscular capacity. Gradually ramp load.
              </div>
              <div v-else-if="analyticsData.metrics.status === 'HIGH_RISK'" class="text-amber-300">
                Elevated fatigue spike (1.3–1.5). Monitor for excessive delayed soreness; recommend restricting high-intensity track sets and emphasizing active recovery.
              </div>
              <div v-else class="text-rose-300">
                Critical danger zone (&gt; 1.5). Severe soft-tissue injury risk detected. Implement an immediate training volume taper; restrict high-velocity efforts.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 28-Day Workload Trend Chart -->
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
          <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider">
            28-Day Workload Distribution (Arbitrary Units)
          </h2>
          <div class="flex items-center gap-4 text-xs text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> Acute Window (Last 7 Days)
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 bg-slate-600 rounded-sm"></span> Chronic History
            </span>
          </div>
        </div>

        <div class="relative h-44 w-full flex items-end justify-between gap-1 pt-4 pb-2">
          <div
            v-for="(day, idx) in analyticsData.daily_trend"
            :key="idx"
            class="group relative flex-1 flex flex-col items-center h-full justify-end"
          >
            <!-- Hover Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
              <div class="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] rounded-lg px-2.5 py-1.5 shadow-2xl whitespace-nowrap">
                <div class="font-bold text-white">{{ day.date_label }} ({{ day.status }})</div>
                <div>Workload: {{ day.workload }} AU</div>
                <div v-if="day.rpe" class="text-slate-400">sRPE {{ day.rpe }} × {{ day.duration_minutes }}m</div>
              </div>
              <div class="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 -mt-1"></div>
            </div>

            <!-- Bar Pillar -->
            <div class="w-full bg-slate-900/60 rounded-t h-full flex items-end">
              <div
                class="w-full rounded-t transition-all duration-300"
                :class="day.is_acute_window ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-slate-600 group-hover:bg-slate-500'"
                :style="{ height: `${Math.max(Math.min(Math.round((day.workload / maxBarWorkload) * 100), 100), 4)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-[11px] text-slate-400 px-1 font-mono pt-2 border-t border-slate-700/40">
          <span>{{ analyticsData.daily_trend[0]?.date_label }}</span>
          <span>Day 14</span>
          <span>{{ analyticsData.daily_trend[analyticsData.daily_trend.length - 1]?.date_label }} (Today)</span>
        </div>
      </div>
    </div>
  </div>
</template>