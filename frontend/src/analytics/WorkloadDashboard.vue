<!-- frontend/src/components/analytics/WorkloadDashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAnalytics } from './useAnalytics';

interface AthleteOption {
  id: string;
  first_name: string;
  last_name: string;
  primary_event: string;
}

const { analyticsData, loading, error, fetchAthleteAnalytics } = useAnalytics();

const athletes = ref<AthleteOption[]>([]);
const selectedAthleteId = ref<string>('');

const fetchAthletesList = async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/athletes/');
    if (res.ok) {
      athletes.value = await res.json();
      if (athletes.value.length > 0) {
        selectedAthleteId.value = athletes.value[0].id;
        fetchAthleteAnalytics(selectedAthleteId.value);
      }
    }
  } catch (err) {
    console.error('Failed to load athlete list for analytics:', err);
  }
};

const handleAthleteSelect = () => {
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

// Styling based on risk zone
const statusBadgeClass = computed(() => {
  const status = analyticsData.value?.metrics.status;
  switch (status) {
    case 'UNDERTRAINED':
      return 'bg-blue-950/80 text-blue-300 border border-blue-800';
    case 'SWEET_SPOT':
      return 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
    case 'HIGH_RISK':
      return 'bg-amber-950/80 text-amber-300 border border-amber-800';
    case 'EXTREME_RISK':
      return 'bg-rose-950/80 text-rose-300 border border-rose-800';
    default:
      return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
});

// Maximum scale calculation for bar heights
const maxBarWorkload = computed(() => {
  if (!analyticsData.value?.daily_trend?.length) return 1000;
  const maxVal = Math.max(...analyticsData.value.daily_trend.map(d => d.workload));
  return Math.max(maxVal, 800);
});
</script>

<template>
  <div class="workload-dashboard bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>⚡</span>
          Workload Analytics & ACWR
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Backend-computed 28-day training load metrics & injury risk monitoring.
        </p>
      </div>

      <!-- Athlete Selection Dropdown -->
      <div class="flex items-center gap-3">
        <label class="text-xs font-semibold text-slate-300">Athlete:</label>
        <select
          v-model="selectedAthleteId"
          @change="handleAthleteSelect"
          class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-xl">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading && !analyticsData" class="py-16 text-center text-slate-500 text-xs">
      Querying PostgreSQL for 28-day rolling window analytics...
    </div>

    <!-- Analytics Dashboard View -->
    <div v-else-if="analyticsData" class="space-y-6">
      <!-- Upper Grid: ACWR Gauge & Workload Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- ACWR Gauge Card -->
        <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-5 flex flex-col items-center justify-between text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Acute : Chronic Ratio
          </span>

          <!-- Gauge SVG -->
          <div class="relative w-48 h-28 my-2">
            <svg class="w-full h-full" viewBox="0 0 100 55">
              <!-- Background Arc -->
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" stroke-width="10" stroke-linecap="round" />
              <!-- Under (<0.8) -->
              <path d="M 10 50 A 40 40 0 0 1 30 18" fill="none" stroke="#3b82f6" stroke-width="10" />
              <!-- Sweet Spot (0.8-1.3) -->
              <path d="M 30 18 A 40 40 0 0 1 70 18" fill="none" stroke="#10b981" stroke-width="10" />
              <!-- Elevated (1.3-1.5) -->
              <path d="M 70 18 A 40 40 0 0 1 82 30" fill="none" stroke="#f59e0b" stroke-width="10" />
              <!-- Danger (>1.5) -->
              <path d="M 82 30 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" stroke-width="10" />

              <!-- Needle -->
              <line
                x1="50"
                y1="50"
                :x2="needleCoordinates.x"
                :y2="needleCoordinates.y"
                stroke="#ffffff"
                stroke-width="3"
                stroke-linecap="round"
                class="transition-all duration-700 ease-out"
              />
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <div class="text-3xl font-extrabold text-white font-mono">
              {{ analyticsData.metrics.acwr.toFixed(2) }}
            </div>
            <div
              class="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide"
              :class="statusBadgeClass"
            >
              {{ analyticsData.metrics.status_label }}
            </div>
          </div>
        </div>

        <!-- Metric Details -->
        <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Acute Workload -->
          <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase">Acute Workload</span>
              <span class="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                7-Day Fatigue
              </span>
            </div>
            <div class="text-3xl font-bold text-white font-mono mt-3">
              {{ analyticsData.metrics.acute_workload }} <span class="text-xs font-normal text-slate-400">AU/day</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">Rolling 7-day average session workload.</p>
          </div>

          <!-- Chronic Workload -->
          <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase">Chronic Workload</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                28-Day Fitness
              </span>
            </div>
            <div class="text-3xl font-bold text-white font-mono mt-3">
              {{ analyticsData.metrics.chronic_workload }} <span class="text-xs font-normal text-slate-400">AU/day</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">Rolling 28-day baseline conditioning capacity.</p>
          </div>

          <!-- Insight Box -->
          <div class="sm:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <span class="text-lg">📋</span>
            <div class="text-xs text-slate-300 leading-relaxed">
              <strong class="text-white block mb-0.5">Automated Recommendation:</strong>
              <span v-if="analyticsData.metrics.status === 'SWEET_SPOT'">
                Optimal load zone (0.8–1.3). Low risk of injury with fitness retention/progression.
              </span>
              <span v-else-if="analyticsData.metrics.status === 'UNDERTRAINED'">
                Under-trained (< 0.8). Athlete is safe from fatigue injury but losing specific conditioning.
              </span>
              <span v-else-if="analyticsData.metrics.status === 'HIGH_RISK'">
                Elevated fatigue spike (1.3–1.5). Watch for delayed onset soreness; restrict high-intensity sets.
              </span>
              <span v-else>
                Danger zone (> 1.5). High soft-tissue injury risk. Active recovery/volume taper advised immediately.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 28-Day Workload Trend Chart -->
      <div class="bg-slate-800/70 border border-slate-700/70 rounded-xl p-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">
            28-Day Workload Distribution (AU)
          </h3>
          <div class="flex items-center gap-4 text-[11px] text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> Acute Window (Last 7 Days)
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 bg-slate-600 rounded-sm"></span> Chronic History
            </span>
          </div>
        </div>

        <!-- Custom SVG / CSS Bar Chart -->
        <div class="relative h-44 w-full flex items-end justify-between gap-1 pt-4 pb-4 border-b border-slate-700">
          <div
            v-for="(day, idx) in analyticsData.daily_trend"
            :key="idx"
            class="group relative flex-1 flex flex-col items-center h-full justify-end"
          >
            <!-- Hover Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
              <div class="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] rounded px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                <div class="font-bold">{{ day.date_label }} ({{ day.status }})</div>
                <div>Workload: {{ day.workload }} AU</div>
                <div v-if="day.rpe">sRPE {{ day.rpe }} × {{ day.duration_minutes }}m</div>
              </div>
              <div class="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 -mt-1"></div>
            </div>

            <!-- Bar Pillar -->
            <div class="w-full bg-slate-800/60 rounded-t h-full flex items-end">
              <div
                class="w-full rounded-t transition-all duration-300"
                :class="day.is_acute_window ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-slate-600/70 group-hover:bg-slate-500'"
                :style="{ height: Math.min(Math.round((day.workload / maxBarWorkload) * 100), 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- X-Axis Labels -->
        <div class="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono">
          <span>{{ analyticsData.daily_trend[0]?.date_label }}</span>
          <span>Day 14</span>
          <span>{{ analyticsData.daily_trend[analyticsData.daily_trend.length - 1]?.date_label }} (Today)</span>
        </div>
      </div>
    </div>
  </div>
</template>