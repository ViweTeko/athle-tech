<!--
  frontend/src/components/attendance/AttendanceLogger.vue

  Attendance and Workload Logger component for Athle-Tech.
  Fetches active roster members from DRF, calculates sRPE workload 
  (sRPE score * duration in minutes), and submits daily logs to /api/attendance/.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface AthleteOption {
  id: string;
  first_name: string;
  last_name: string;
  primary_event: string;
  status: string;
}

interface LogEntry {
  athlete_id: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'INJURED';
  srpe: number; // Scale 1 (Rest/Very Light) to 10 (Max Effort)
  duration_minutes: number;
  notes: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Reactive State
const athletes = ref<AthleteOption[]>([]);
const sessionDate = ref<string>(new Date().toISOString().split('T')[0]);
const loading = ref<boolean>(false);
const submitting = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Active Form State
const selectedAthleteId = ref<string>('');
const form = ref<LogEntry>({
  athlete_id: '',
  status: 'PRESENT',
  srpe: 5,
  duration_minutes: 60,
  notes: '',
});

/**
 * Calculated Daily Workload Load Value: sRPE (1-10) * Duration (mins)
 */
const calculatedWorkload = computed(() => {
  if (form.value.status !== 'PRESENT') return 0;
  return form.value.srpe * form.value.duration_minutes;
});

/**
 * Fetch active athletes for dropdown selection
 */
const fetchAthletes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/athletes/`);
    if (!res.ok) throw new Error('Failed to fetch athletes');
    const data = await res.json();
    athletes.value = data.filter((a: AthleteOption) => a.status !== 'INACTIVE');
    if (athletes.value.length > 0) {
      selectedAthleteId.value = athletes.value[0].id;
      form.value.athlete_id = athletes.value[0].id;
    }
  } catch (err: any) {
    error.value = err.message || 'Error loading roster from backend.';
  } finally {
    loading.value = false;
  }
};

/**
 * Submit Attendance Log to DRF API
 */
const handleSubmitLog = async () => {
  if (!form.value.athlete_id) {
    error.value = 'Please select an athlete.';
    return;
  }

  submitting.value = true;
  error.value = null;
  successMessage.value = null;

  const payload = {
    athlete: form.value.athlete_id,
    date: sessionDate.value,
    status: form.value.status,
    srpe: form.value.status === 'PRESENT' ? form.value.srpe : null,
    duration_minutes: form.value.status === 'PRESENT' ? form.value.duration_minutes : 0,
    workload: calculatedWorkload.value,
    notes: form.value.notes,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/attendance/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(JSON.stringify(errData));
    }

    successMessage.value = `Logged ${calculatedWorkload.value} AU workload for selected athlete.`;
    
    // Reset non-static form fields
    form.value.notes = '';
    form.value.srpe = 5;
  } catch (err: any) {
    error.value = err.message || 'Failed to submit attendance log.';
  } finally {
    submitting.value = false;
  }
};

const handleAthleteChange = () => {
  form.value.athlete_id = selectedAthleteId.value;
};

onMounted(() => {
  fetchAthletes();
});
</script>

<template>
  <div class="attendance-logger max-w-3xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
    <div class="border-b border-slate-700 pb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Log Session Attendance & Workload</h2>
        <p class="text-xs text-slate-400">Record sRPE and duration to compute Acute:Chronic Workload Ratios.</p>
      </div>
      <div>
        <input
          v-model="sessionDate"
          type="date"
          class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-200 text-sm p-3.5 rounded-xl">
      {{ error }}
    </div>
    <div v-if="successMessage" class="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm p-3.5 rounded-xl flex justify-between items-center">
      <span>{{ successMessage }}</span>
      <button @click="successMessage = null" class="text-xs text-emerald-400 underline">Dismiss</button>
    </div>

    <!-- Loading Roster State -->
    <div v-if="loading" class="text-center py-8 text-slate-400">
      Loading roster from PostgreSQL...
    </div>

    <!-- Main Logger Form -->
    <form v-else @submit.prevent="handleSubmitLog" class="space-y-6">
      <!-- Athlete Select Dropdown -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-2">Select Athlete</label>
        <select
          v-model="selectedAthleteId"
          @change="handleAthleteChange"
          class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option v-for="athlete in athletes" :key="athlete.id" :value="athlete.id">
            {{ athlete.first_name }} {{ athlete.last_name }} ({{ athlete.primary_event }})
          </option>
        </select>
      </div>

      <!-- Attendance Status Toggle -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-2">Attendance Status</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            type="button"
            v-for="status in ['PRESENT', 'ABSENT', 'EXCUSED', 'INJURED'] as const"
            :key="status"
            @click="form.status = status"
            :class="[
              'py-2.5 rounded-lg text-xs font-bold transition-all border',
              form.status === status
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
            ]"
          >
            {{ status }}
          </button>
        </div>
      </div>

      <!-- Workload Inputs (Only shown when PRESENT) -->
      <div v-if="form.status === 'PRESENT'" class="space-y-6 bg-slate-900/60 p-5 rounded-xl border border-slate-700/60">
        <!-- sRPE Range Slider -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs font-semibold text-slate-300">Session RPE (RPE 1 - 10)</label>
            <span class="text-emerald-400 font-bold font-mono text-sm">RPE {{ form.srpe }}</span>
          </div>
          <input
            v-model.number="form.srpe"
            type="range"
            min="1"
            max="10"
            step="1"
            class="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1 (Very Easy)</span>
            <span>5 (Moderate)</span>
            <span>10 (Maximal Effort)</span>
          </div>
        </div>

        <!-- Duration Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
          <input
            v-model.number="form.duration_minutes"
            type="number"
            min="5"
            max="300"
            step="5"
            required
            class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <!-- Computed Workload Display -->
        <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-medium">Computed Session Workload:</span>
          <span class="text-lg font-bold text-emerald-400 font-mono">
            {{ calculatedWorkload }} AU <span class="text-xs text-slate-500 font-normal">({{ form.srpe }} × {{ form.duration_minutes }}m)</span>
          </span>
        </div>
      </div>

      <!-- Session Notes -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Session / Recovery Notes (Optional)</label>
        <textarea
          v-model="form.notes"
          rows="2"
          placeholder="e.g., Felt strong during 400m intervals; slight tightness in right hamstring."
          class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
        ></textarea>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="submitting || athletes.length === 0"
        class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
      >
        <span>{{ submitting ? 'Submitting Log...' : 'Save Attendance Log' }}</span>
      </button>
    </form>
  </div>
</template>