<!--
  frontend/src/components/athletes/AthleteRoster.vue

  Athlete Roster view component. Fetches, filters, and manages athletes directly 
  via the Django REST Framework API (http://127.0.0.1:8000/api/athletes/).
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Athlete, PrimaryEvent, RosterStatus } from './types';

const emit = defineEmits<{
  (e: 'log-workload', athlete: Athlete): void;
}>();

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Reactive State
const athletes = ref<Athlete[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const searchQuery = ref<string>('');
const selectedStatus = ref<string>('ALL');
const isAddModalOpen = ref<boolean>(false);

// Form State for Adding Athlete
const newAthlete = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'M',
  primary_event: 'SPRINT' as PrimaryEvent,
  status: 'ACTIVE' as RosterStatus,
});

/**
 * Fetch all athletes from Django REST Framework API
 */
const fetchAthletes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_BASE_URL}/athletes/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch athletes: ${response.statusText}`);
    }
    const data = await response.json();
    athletes.value = data;
  } catch (err: any) {
    error.value = err.message || 'Error connecting to Django API backend';
  } finally {
    loading.value = false;
  }
};

/**
 * Submit a new athlete record to Django REST Framework API
 */
const handleAddAthlete = async () => {
  if (!newAthlete.value.first_name || !newAthlete.value.last_name) return;

  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_BASE_URL}/athletes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newAthlete.value),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(JSON.stringify(errData));
    }

    const createdAthlete: Athlete = await response.json();
    athletes.value.unshift(createdAthlete);

    // Reset Form & Close Modal
    newAthlete.value = {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'M',
      primary_event: 'SPRINTS',
      status: 'ACTIVE',
    };
    isAddModalOpen.value = false;
  } catch (err: any) {
    error.value = err.message || 'Error saving athlete';
  } finally {
    loading.value = false;
  }
};

/**
 * Filtered athletes derived from search query and status dropdown
 */
const filteredAthletes = computed(() => {
  return athletes.value.filter((athlete) => {
    const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.value.toLowerCase());
    const matchesStatus =
      selectedStatus.value === 'ALL' || athlete.status === selectedStatus.value;
    return matchesSearch && matchesStatus;
  });
});

onMounted(() => {
  fetchAthletes();
});
</script>

<template>
  <div class="athlete-roster max-w-7xl mx-auto space-y-6">
    <!-- Action Controls Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
      <div class="flex flex-col sm:flex-row gap-3 flex-grow max-w-2xl">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search athlete by name..."
          class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 flex-grow"
        />
        <select
          v-model="selectedStatus"
          class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INJURED">Injured</option>
          <option value="REST">Rest / Off-Season</option>
        </select>
      </div>

      <button
        @click="isAddModalOpen = true"
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>+</span> Add Athlete
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-rose-900/50 border border-rose-700 text-rose-200 p-4 rounded-xl flex justify-between items-center">
      <span>{{ error }}</span>
      <button @click="fetchAthletes" class="underline hover:text-white">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && athletes.length === 0" class="text-center py-12 text-slate-400">
      Loading athlete roster from PostgreSQL...
    </div>

    <!-- Roster Grid -->
    <div v-else-if="filteredAthletes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="athlete in filteredAthletes"
        :key="athlete.id"
        class="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between"
      >
        <div>
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-lg font-bold text-slate-100">
                {{ athlete.first_name }} {{ athlete.last_name }}
              </h3>
              <p class="text-xs text-slate-400 font-mono">{{ athlete.primary_event }}</p>
            </div>
            <span
              :class="{
                'bg-emerald-950 text-emerald-400 border-emerald-800': athlete.status === 'ACTIVE',
                'bg-rose-950 text-rose-400 border-rose-800': athlete.status === 'INJURED',
                'bg-amber-950 text-amber-400 border-amber-800': athlete.status === 'RESTING',
              }"
              class="text-xs font-semibold px-2.5 py-1 rounded-full border"
            >
              {{ athlete.status }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mb-4">DOB: {{ athlete.date_of_birth }}</p>
        </div>

        <button
          @click="emit('log-workload', athlete)"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          ⚡ Log Workload
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-slate-400">
      No athletes found matching criteria.
    </div>

    <!-- Add Athlete Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 class="text-xl font-bold text-slate-100 mb-4">Add New Athlete</h2>

        <form @submit.prevent="handleAddAthlete" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
            <input
              v-model="newAthlete.first_name"
              type="text"
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
            <input
              v-model="newAthlete.last_name"
              type="text"
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
            <input
              v-model="newAthlete.date_of_birth"
              type="date"
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                v-model="newAthlete.gender"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                v-model="newAthlete.status"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INJURED">Injured</option>
                <option value="REST">Rest</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Primary Event</label>
            <select
              v-model="newAthlete.primary_event"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="SPRINT">Sprint (100m - 400m)</option>
              <option value="MIDDLE">Middle Distance (800m - 1500m)</option>
              <option value="LONG">Long Distance (5000m+)</option>
              <option value="HURDLES">Hurdles</option>
              <option value="JUMPS">Jumps</option>
              <option value="THROWS">Throws</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {{ loading ? 'Saving...' : 'Save Athlete' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>