<!-- frontend/src/components/performance/ResultEntryForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ASA_SENIOR_STANDARDS_MALE } from './usePerformance';

const props = defineProps<{
  athletes: Array<{ id: string; first_name: string; last_name: string; primary_event: string }>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: any): void;
}>();

const availableEvents = ['100m', '200m', '400m', '800m', '1500m', '5000m', '10km', '21.1km'];

const selectedAthlete = ref<string>(props.athletes[0]?.id || '');
const selectedEvent = ref<string>('100m');
const rawResult = ref<string>('');
const compDate = ref<string>(new Date().toISOString().split('T')[0]);
const formError = ref<string | null>(null);

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
    formError.value = 'Please enter a valid positive numeric time (seconds or mm:ss.ms).';
    return;
  }

  const standard = ASA_SENIOR_STANDARDS_MALE[selectedEvent.value] ?? parsedValue;

  emit('submit', {
    athlete: selectedAthlete.value,
    event_name: selectedEvent.value,
    date: compDate.value,
    recorded_time_seconds: parsedValue.toFixed(2),
    asa_standard_seconds: standard.toFixed(2),
  });

  rawResult.value = '';
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
    <h3 class="text-base font-bold text-slate-100">Log Race Result</h3>

    <div v-if="formError" class="text-xs bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-lg">
      {{ formError }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Event</label>
        <select
          v-model="selectedEvent"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option v-for="ev in availableEvents" :key="ev" :value="ev">
            {{ ev }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Result (Secs or mm:ss.ms)</label>
        <input
          v-model="rawResult"
          type="text"
          placeholder="e.g., 10.35 or 3:45.20"
          required
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

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

    <button
      type="submit"
      :disabled="loading"
      class="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg"
    >
      {{ loading ? 'Saving Result...' : 'Save Competition Performance' }}
    </button>
  </form>
</template>