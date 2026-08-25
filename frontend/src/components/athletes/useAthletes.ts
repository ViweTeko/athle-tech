import { ref, computed, Ref } from 'vue';
import type { Athlete, DisciplineFilter } from './types';

/**
 * Custom Vue composable hook to manage athlete roster filtering, search queries,
 * and computed statistics/metrics.
 * 
 * @param {Ref<Athlete[] | undefined>} [athletesRef] Optional reactive reference to a list of athletes. Defaults to a mock dataset if undefined.
 * @returns Object containing reactive filters, search query, filtered list of athletes, and calculated discipline statistics.
 */
export function useAthletes(athletesRef?: Ref<Athlete[] | undefined>) {
  // Default Mock Data if no props provided
  const mockAthletes: Athlete[] = [
    {
      athlete_id: '101e4567-e89b-12d3-a456-426614174001',
      full_name: 'Sipho Ndlovu',
      age_category: 'U20',
      primary_discipline: 'TRACK_FIELD',
      created_at: '2026-01-15T08:30:00Z'
    },
    {
      athlete_id: '202e4567-e89b-12d3-a456-426614174002',
      full_name: 'Anika van Zyl',
      age_category: 'SENIOR',
      primary_discipline: 'CROSS_COUNTRY',
      created_at: '2026-02-01T10:15:00Z'
    },
    {
      athlete_id: '303e4567-e89b-12d3-a456-426614174003',
      full_name: 'Lethabo Mokoena',
      age_category: 'U18',
      primary_discipline: 'TRACK_FIELD',
      created_at: '2026-02-10T14:20:00Z'
    },
    {
      athlete_id: '404e4567-e89b-12d3-a456-426614174004',
      full_name: 'Pieter Botha',
      age_category: 'SENIOR',
      primary_discipline: 'ROAD',
      created_at: '2026-03-05T09:00:00Z'
    },
    {
      athlete_id: '505e4567-e89b-12d3-a456-426614174005',
      full_name: 'Zola Khumalo',
      age_category: 'U16',
      primary_discipline: 'CROSS_COUNTRY',
      created_at: '2026-03-12T11:45:00Z'
    },
    {
      athlete_id: '606e4567-e89b-12d3-a456-426614174006',
      full_name: 'Jessica Daniels',
      age_category: 'U20',
      primary_discipline: 'ROAD',
      created_at: '2026-04-02T16:10:00Z'
    }
  ];

  const selectedFilter = ref<DisciplineFilter>('ALL');
  const searchQuery = ref('');

  const rosterList = computed<Athlete[]>(() => athletesRef?.value ?? mockAthletes);

  const stats = computed(() => {
    const list = rosterList.value;
    return {
      total: list.length,
      track: list.filter((a) => a.primary_discipline === 'TRACK_FIELD').length,
      xc: list.filter((a) => a.primary_discipline === 'CROSS_COUNTRY').length,
      road: list.filter((a) => a.primary_discipline === 'ROAD').length
    };
  });

  const filteredAthletes = computed(() => {
    return rosterList.value.filter((athlete) => {
      const matchesFilter =
        selectedFilter.value === 'ALL' ||
        athlete.primary_discipline === selectedFilter.value;
      const matchesSearch = athlete.full_name
        .toLowerCase()
        .includes(searchQuery.value.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  });

  return {
    selectedFilter,
    searchQuery,
    filteredAthletes,
    stats,
    mockAthletes
  };
}
