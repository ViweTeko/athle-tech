<!-- frontend/src/components/attendance/AttendanceLogger.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiFetch } from '../../utils/api';
import { useRoute } from 'vue-router';

interface AthleteOption {
  id: string;
  first_name: string;
  last_name: string;
  primary_event: string;
  status: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';
type SessionType = 'TRACK' | 'LONG_RUN' | 'TEMPO' | 'STRENGTH' | 'RECOVERY';

interface AttendanceRecord {
  id: string;
  athlete: string;
  date: string;
  status: AttendanceStatus;
  session_type: SessionType;
  duration_minutes: number;
  rpe: number;
  session_workload: number;
}

const route = useRoute();

const athletes = ref<AthleteOption[]>([]);
const recentLogs = ref<AttendanceRecord[]>([]);
const loading = ref<boolean>(false);
const submitting = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const editingId = ref<string | null>(null);

const form = ref({
  athlete: '',
  date: new Date().toISOString().split('T')[0],
  status: 'PRESENT' as AttendanceStatus,
  session_type: 'TRACK' as SessionType,
  duration_minutes: 60,
  rpe: 5,
});

const calculatedWorkload = computed(() => {
  if (form.value.status !== 'PRESENT') return 0;
  return form.value.rpe * form.value.duration_minutes;
});

const fetchRecentLogs = async (athleteId: string) => {
  if (!athleteId) return;
  try {
    const data = await apiFetch<AttendanceRecord[]>(`/attendance/?athlete=${athleteId}`);
    recentLogs.value = data.slice(0, 7); // Show last 7 entries
  } catch (err) {
    console.error('Failed to load recent logs', err);
  }
};

const handleAthleteChange = () => {
  fetchRecentLogs(form.value.athlete);
};

const fetchAthletes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiFetch<AthleteOption[]>('/athletes/');
    athletes.value = data.filter((a: AthleteOption) => a.status !== 'INACTIVE');

    const queryAthleteId = route.query.athlete as string;
    if (queryAthleteId && athletes.value.some(a => a.id === queryAthleteId)) {
      form.value.athlete = queryAthleteId;
    } else if (athletes.value.length > 0) {
      form.value.athlete = athletes.value[0].id;
    }
    if (form.value.athlete) {
      fetchRecentLogs(form.value.athlete);
    }
  } catch (err: any) {
    error.value = err.message || 'Error loading roster from backend.';
  } finally {
    loading.value = false;
  }
};

const startEdit = (log: AttendanceRecord) => {
  editingId.value = log.id;
  form.value = {
    athlete: log.athlete,
    date: log.date,
    status: log.status,
    session_type: log.session_type,
    duration_minutes: log.duration_minutes,
    rpe: log.rpe,
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  editingId.value = null;
  form.value = {
    athlete: form.value.athlete,
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    session_type: 'TRACK',
    duration_minutes: 60,
    rpe: 5,
  };
};

const handleSubmitLog = async () => {
  if (!form.value.athlete) {
    error.value = 'Please select an athlete.';
    return;
  }

  submitting.value = true;
  error.value = null;
  successMessage.value = null;

  const payload = {
    athlete: form.value.athlete,
    date: form.value.date,
    status: form.value.status,
    session_type: form.value.session_type,
    duration_minutes: form.value.status === 'PRESENT' ? form.value.duration_minutes : 0,
    rpe: form.value.rpe,
  };

  try {
    if (editingId.value) {
      await apiFetch(`/attendance/${editingId.value}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      successMessage.value = `Updated session successfully (${calculatedWorkload.value} AU).`;
      editingId.value = null;
    } else {
      await apiFetch('/attendance/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      successMessage.value = `Recorded ${calculatedWorkload.value} AU workload successfully.`;
    }
    form.value.rpe = 5;
    fetchRecentLogs(form.value.athlete);
  } catch (err: any) {
    error.value = err.message || 'Failed to submit attendance log.';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchAthletes();
});
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
      <div class="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-100">
            {{ editingId ? '✏️ Edit Training Session' : 'Log Session Attendance & Workload' }}
          </h2>
          <p class="text-xs text-slate-400">
            {{ editingId ? 'Updating existing recorded session metrics.' : 'Record single or multiple sessions per day to track ACWR.' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="editingId"
            @click="cancelEdit"
            class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200"
          >
            Cancel Edit
          </button>
          <input
            v-model="form.date"
            type="date"
            class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div v-if="error" class="bg-rose-950/80 border border-rose-800 text-rose-200 text-sm p-3.5 rounded-xl">
        {{ error }}
      </div>
      <div v-if="successMessage" class="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm p-3.5 rounded-xl flex justify-between items-center">
        <span>{{ successMessage }}</span>
        <button @click="successMessage = null" class="text-xs text-emerald-400 underline">Dismiss</button>
      </div>

      <div v-if="loading" class="text-center py-8 text-slate-400">
        Loading roster from PostgreSQL...
      </div>

      <form v-else @submit.prevent="handleSubmitLog" class="space-y-6">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-2">Select Athlete</label>
          <select
            v-model="form.athlete"
            @change="handleAthleteChange"
            :disabled="!!editingId"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option v-for="athlete in athletes" :key="athlete.id" :value="athlete.id">
              {{ athlete.first_name }} {{ athlete.last_name }} ({{ athlete.primary_event }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-2">Attendance Status</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              v-for="status in ['PRESENT', 'ABSENT', 'EXCUSED'] as const"
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

        <div v-if="form.status === 'PRESENT'" class="space-y-6 bg-slate-900/60 p-5 rounded-xl border border-slate-700/60">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Session Type</label>
              <select
                v-model="form.session_type"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="TRACK">Track Intervals</option>
                <option value="LONG_RUN">Long Run</option>
                <option value="TEMPO">Tempo Run</option>
                <option value="STRENGTH">Gym / Strength</option>
                <option value="RECOVERY">Active Recovery</option>
              </select>
            </div>

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
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-semibold text-slate-300">Session RPE (Scale 1 - 10)</label>
              <span class="text-emerald-400 font-bold font-mono text-sm">RPE {{ form.rpe }}</span>
            </div>
            <input
              v-model.number="form.rpe"
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

          <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">Computed Session Workload:</span>
            <span class="text-lg font-bold text-emerald-400 font-mono">
              {{ calculatedWorkload }} AU <span class="text-xs text-slate-500 font-normal">({{ form.rpe }} × {{ form.duration_minutes }}m)</span>
            </span>
          </div>
        </div>

        <button
          type="submit"
          :disabled="submitting || athletes.length === 0"
          class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <span>{{ submitting ? 'Saving...' : editingId ? 'Update Session' : 'Save Attendance Log' }}</span>
        </button>
      </form>
    </div>

    <!-- Recent Recorded Sessions for Selected Athlete -->
    <div v-if="recentLogs.length > 0" class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider">
        Recent Sessions (Click to Edit)
      </h3>
      <div class="divide-y divide-slate-700/60 font-mono text-xs">
        <div
          v-for="log in recentLogs"
          :key="log.id"
          class="py-3 flex items-center justify-between hover:bg-slate-700/30 px-3 rounded-lg transition"
        >
          <div>
            <span class="text-slate-200 font-semibold font-sans">{{ log.date }}</span>
            <span class="text-slate-400 font-sans ml-2">({{ log.session_type }})</span>
            <span class="text-emerald-400 font-bold ml-3">{{ log.session_workload }} AU</span>
            <span class="text-slate-500 text-[11px] ml-1">({{ log.duration_minutes }}m @ RPE {{ log.rpe }})</span>
          </div>
          <button
            @click="startEdit(log)"
            class="text-indigo-400 hover:text-indigo-300 font-sans font-semibold text-xs underline"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>