<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiFetch, apiDownload } from '../utils/api';

interface GapItem {
  athlete_id: string;
  athlete_name: string;
  gender: string;
  event: string;
  category: string;
  standard: number;
  athlete_best: number;
  gap: number;
  percentage_gap: number;
  is_qualified: boolean;
  status: string;
  unit: string;
}

const selectedCategory = ref<string>('Senior');
const categories = ['Senior', 'U20', 'U18', 'U16'];
const gapData = ref<GapItem[]>([]);
const loading = ref<boolean>(false);
const exporting = ref<boolean>(false);

const fetchGapData = async () => {
  loading.value = true;
  try {
    gapData.value = await apiFetch<GapItem[]>(`/analytics/asa-gap/?category=${selectedCategory.value}`);
  } catch (err) {
    console.error('Failed to load ASA gap report:', err);
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  exporting.value = true;
  try {
    await apiDownload(
      `/analytics/asa-gap/export/?category=${selectedCategory.value}`,
      `asa_standards_gap_${selectedCategory.value.toLowerCase()}.csv`
    );
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
};

const formatValue = (val: number, unit: string) => {
  if (unit === 's') {
    if (val >= 60) {
      const mins = Math.floor(val / 60);
      const secs = (val % 60).toFixed(2).padStart(5, '0');
      return `${mins}:${secs}`;
    }
    return `${val.toFixed(2)}s`;
  }
  return `${val.toFixed(2)}m`;
};

onMounted(fetchGapData);
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>🎯</span> ASA Qualification Standards Gap Engine
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Performance gap evaluation against Athletics South Africa National Championship standards.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <select
          v-model="selectedCategory"
          @change="fetchGapData"
          class="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }} Division</option>
        </select>

        <button
          @click="handleExport"
          :disabled="exporting || loading"
          class="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow"
        >
          <span>📥</span>
          {{ exporting ? 'Exporting...' : 'Export ASA Report' }}
        </button>
      </div>
    </div>

    <!-- Table Telemetry -->
    <div class="overflow-x-auto mt-6">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="bg-slate-800/60 uppercase text-[11px] tracking-wider text-slate-400 border-b border-slate-700">
          <tr>
            <th class="py-3 px-4">Athlete</th>
            <th class="py-3 px-3">Event</th>
            <th class="py-3 px-3">Athlete Best</th>
            <th class="py-3 px-3">ASA Standard</th>
            <th class="py-3 px-3">Delta Margin</th>
            <th class="py-3 px-3">Gap %</th>
            <th class="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
          <tr v-if="loading">
            <td colspan="7" class="py-8 text-center text-slate-500">Calculating qualification deltas...</td>
          </tr>
          <tr v-else-if="gapData.length === 0">
            <td colspan="7" class="py-8 text-center text-slate-500">No race performances logged for this division.</td>
          </tr>
          <tr v-for="item in gapData" :key="item.athlete_id" class="hover:bg-slate-800/40 transition-colors">
            <td class="py-3 px-4 font-sans font-medium text-slate-200">{{ item.athlete_name }}</td>
            <td class="py-3 px-3 font-sans">{{ item.event }} ({{ item.gender }})</td>
            <td class="py-3 px-3 font-semibold text-slate-100">{{ formatValue(item.athlete_best, item.unit) }}</td>
            <td class="py-3 px-3 text-slate-400">{{ formatValue(item.standard, item.unit) }}</td>
            <td class="py-3 px-3" :class="item.is_qualified ? 'text-emerald-400' : 'text-amber-400'">
              {{ item.gap > 0 && item.unit === 's' ? '+' : '' }}{{ item.gap.toFixed(2) }}{{ item.unit }}
            </td>
            <td class="py-3 px-3 font-semibold" :class="item.is_qualified ? 'text-emerald-400' : 'text-rose-400'">
              {{ item.percentage_gap > 0 ? '+' : '' }}{{ item.percentage_gap.toFixed(2) }}%
            </td>
            <td class="py-3 px-4 font-sans">
              <span
                class="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="{
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40': item.is_qualified,
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40': item.status.includes('CONTENDER'),
                  'bg-amber-500/20 text-amber-400 border border-amber-500/40': item.status.includes('DEVELOPMENT'),
                  'bg-slate-800 text-slate-500 border border-slate-700': item.status.includes('OFF')
                }"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>