<!-- frontend/src/performance/ResultEntryForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TrackAndFieldEvent } from './types';
import { isFieldEvent } from './usePerformance';

const props = defineProps<{
  athletes: Array<{ id: string; first_name: string; last_name: string; primary_event: string }>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: any): void;
}>();

const availableEvents: TrackAndFieldEvent[] = [
  '100M', '200M', '400M', '110MH', '400MH',
  '800M', '1500M', '3000M', '5000M', '10000M',
  'LONG_JUMP', 'HIGH_JUMP', 'TRIPLE_JUMP', 'SHOT_PUT', 'DISCUS', 'JAVELIN'
];

const selectedAthlete = ref<string>(props.athletes[0]?.id || '');
const selectedEvent = ref<TrackAndFieldEvent>('100M');
const rawResult = ref<string>(''); // e.g. 10.45 or 3:42.12 or 7.82
const compName = ref<string>('');
const compDate = ref<string>(new Date().toISOString().split('T')[0]);
const wind = ref<number | null>(null);
const isPb = ref<boolean>(false);
const formError = ref<string | null>(null);

const isField = computed(() => isFieldEvent(selectedEvent.value));

/**
 * Parses user input (handles seconds, mm:ss.ms strings, and meters) into numeric value.
 */
const parseResultValue = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  }
  const val = parseFloat(trimmed);
  return isNaN(val) ? null : val;
};

const handleSubmit = () => {
  formError.value = null;
  const parsedValue = parseResultValue(rawResult.value);

  if (!selectedAthlete.value) {
    formError.value = 'Please select an athlete.';
    return;
  }
  if (parsedValue === null || parsedValue <= 0) {
    formError.value = 'Please enter a valid positive numeric mark or mm:ss.ms time.';
    return;
  }

  emit('submit', {
    athlete: selectedAthlete.value,
    event: selectedEvent.value,
    result_value: parsedValue,
    result_display: rawResult.value,
    competition_name: compName.value || 'Official ASA League Meet',
    competition_date: compDate.value,
    wind_reading: isField.value || selectedEvent.value.includes('M') ? wind.value : null,
    is_personal_best: isPb.value,
  });

  // Reset form
  rawResult.value = '';
  compName.value = '';
  wind.value = null;
  isPb.value = false;
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
    <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
      <span>Log Race / Competition Result</span>
    </h3>

    <div v-if="formError" class="text-xs bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-lg">
      {{ formError }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Athlete Selection -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Athlete</label>
        <select
          v-model="selectedAthlete"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option v-for="a in athletes" :key="a.id" :value="a.id">
            {{ a.first_name }} {{ a.last_name }} ({{ a.primary_event }})
          </option>
        </select>
      </div>

      <!-- Event Discipline -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Event</label>
        <select
          v-model="selectedEvent"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option v-for="ev in availableEvents" :key="ev" :value="ev">
            {{ ev.replace('_', ' ') }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Performance Mark -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">
          Result Mark {{ isField ? '(Meters, e.g. 7.82)' : '(Secs or mm:ss.ms)' }}
        </label>
        <input
          v-model="rawResult"
          type="text"
          placeholder="e.g., 10.35 or 3:45.20"
          required
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      <!-- Competition Name -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Competition / Meet</label>
        <input
          v-model="compName"
          type="text"
          placeholder="e.g., EPA Track & Field Championship"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <!-- Competition Date -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Date</label>
        <input
          v-model="compDate"
          type="date"
          required
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Wind Gauge (For sprints/jumps) -->
    <div class="flex items-center justify-between pt-2">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-300">Wind Gauge (m/s):</label>
        <input
          v-model.number="wind"
          type="number"
          step="0.1"
          placeholder="+0.0"
          class="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="isPb" type="checkbox" class="accent-indigo-500 rounded" />
        <span class="text-xs text-amber-300 font-semibold">Flag as Personal Best (PB)</span>
      </label>
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg"
    >
      {{ loading ? 'Saving Result...' : 'Save Competition Performance' }}
    </button>
  </form>
</template>