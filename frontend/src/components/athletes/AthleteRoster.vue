<!--
  frontend/src/components/athletes/AthleteRoster.vue

  Athlete Roster view container for Athle-Tech.
  Orchestrates fetching athletes from DRF, filtering via RosterToolbar and useAthletes,
  rendering cards via AthleteCard, and adding new athletes via modal.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Athlete, PrimaryEvent, RosterStatus } from './types';
import { useAthletes } from './useAthletes';
import RosterToolbar from './RosterToolbar.vue';
import AthleteCard from './AthleteCard.vue';

const emit = defineEmits<{
  (e: 'log-workload', athlete: Athlete): void;
}>();

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Base reactive state
const athletes = ref<Athlete[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const isAddModalOpen = ref<boolean>(false);

// Initialize filtering and stats composable over the fetched list
const {
  selectedStatus,
  selectedEvent,
  searchQuery,
  filteredAthletes,
  stats,
} = useAthletes(athletes);

// Add Athlete Form State
const newAthlete = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'M' as 'M' | 'F',
  primary_event: 'SPRINTS' as PrimaryEvent,
  status: 'ACTIVE' as RosterStatus,
});

/**
 * Fetch all athletes from the Django REST API
 */
const fetchAthletes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_BASE_URL}/athletes/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch athletes: ${response.statusText}`);
    }
    const data: Athlete[] = await response.json();
    athletes.value = data;
  } catch (err: any) {
    error.value = err.message || 'Error connecting to Django API backend';
  } finally {
    loading.value = false;
  }
};

/**
 * Submit a new athlete record to the DRF API
 */
const handleAddAthlete = async () => {
  if (!newAthlete.value.first_name || !newAthlete.value.last_name || !newAthlete.value.date_of_birth) {
    return;
  }

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

onMounted(() => {
  fetchAthletes();
});
</script>

<template>
  <div class="athlete-roster max-w-7xl mx-auto space-y-6">
    <!-- Header with Add Action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100">Athlete Roster</h1>
        <p class="text-xs text-slate-400">Manage squad profiles, training disciplines, and active roster statuses.</p>
      </div>
      <button
        @click="isAddModalOpen = true"
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
      >
        <span>+</span> Add Athlete
      </button>
    </div>

    <!-- Toolbar Filters (Search, Status Pills, Event Discipline Pills) -->
    <RosterToolbar
      v-model:searchQuery="searchQuery"
      v-model:selectedStatus="selectedStatus"
      v-model:selectedEvent="selectedEvent"
      :stats="stats"
    />

    <!-- Error State -->
    <div v-if="error" class="bg-rose-900/50 border border-rose-700 text-rose-200 p-4 rounded-xl flex justify-between items-center">
      <span>{{ error }}</span>
      <button @click="fetchAthletes" class="underline hover:text-white text-sm">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && athletes.length === 0" class="text-center py-12 text-slate-400">
      Loading athlete roster from PostgreSQL...
    </div>

    <!-- Roster Grid -->
    <div v-else-if="filteredAthletes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AthleteCard
        v-for="athlete in filteredAthletes"
        :key="athlete.id"
        :athlete="athlete"
        @log-workload="emit('log-workload', athlete)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-slate-400">
      No athletes found matching current filter criteria.
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
                <option value="RESTING">Resting</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Primary Event</label>
            <select
              v-model="newAthlete.primary_event"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="SPRINTS">Sprints (100m - 400m)</option>
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