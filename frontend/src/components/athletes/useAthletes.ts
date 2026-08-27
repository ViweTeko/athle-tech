/**
 * frontend/src/components/athletes/useAthletes.ts
 *
 * Vue 3 composable for client-side filtering and computed statistics over
 * an already-fetched list of Athlete records. Used as a lightweight filter
 * layer on top of the API response returned by AthleteRoster.vue.
 */

import { ref, computed, Ref } from 'vue';
import type { Athlete, RosterStatus, PrimaryEvent } from './types';

/** Filter value representing a subset of athletes by status. */
export type StatusFilter = 'ALL' | RosterStatus;

/** Filter value representing a subset of athletes by primary event. */
export type EventFilter = 'ALL' | PrimaryEvent;

/**
 * Custom Vue composable hook to manage athlete roster filtering, search queries,
 * and computed statistics/metrics over a reactive list of Athlete records.
 *
 * @param athletesRef - Optional reactive reference to a list of athletes.
 *   Defaults to an empty list when undefined; callers should supply
 *   a ref that is populated by the API fetch in AthleteRoster.vue.
 * @returns Reactive filters, the filtered athlete list, and computed event statistics.
 */
export function useAthletes(athletesRef?: Ref<Athlete[] | undefined>) {
  const selectedStatus = ref<StatusFilter>('ALL');
  const searchQuery = ref('');

  const rosterList = computed<Athlete[]>(() => athletesRef?.value ?? []);

  const stats = computed(() => {
    const list = rosterList.value;
    return {
      total: list.length,
      sprints: list.filter((a) => a.primary_event === 'SPRINTS').length,
      middle: list.filter((a) => a.primary_event === 'MIDDLE').length,
      long: list.filter((a) => a.primary_event === 'LONG').length,
      active: list.filter((a) => a.status === 'ACTIVE').length,
      injured: list.filter((a) => a.status === 'INJURED').length,
    };
  });

  const filteredAthletes = computed(() => {
    return rosterList.value.filter((athlete) => {
      const matchesStatus =
        selectedStatus.value === 'ALL' || athlete.status === selectedStatus.value;
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.value.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  });

  return {
    selectedStatus,
    searchQuery,
    filteredAthletes,
    stats,
  };
}
