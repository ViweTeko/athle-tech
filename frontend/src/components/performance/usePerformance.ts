/**
 * frontend/src/performance/usePerformance.ts
 *
 * Composable handling multi-event results, PB detection, and ASA deltas.
 */

import { ref, computed } from 'vue';
import type { RacePerformanceRecord, TrackAndFieldEvent, PerformanceDelta } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// ASA Senior Benchmark Standard Marks (National Qualifying Reference)
export const ASA_SENIOR_STANDARDS_MALE: Partial<Record<TrackAndFieldEvent, number>> = {
  '100M': 10.30,
  '200M': 20.70,
  '400M': 46.20,
  '800M': 107.50, // 1:47.50
  '1500M': 222.00, // 3:42.00
  '5000M': 830.00, // 13:50.00
  '10000M': 1740.00, // 29:00.00
  '110MH': 14.00,
  'LONG_JUMP': 7.90,
  'HIGH_JUMP': 2.20,
  'SHOT_PUT': 18.50,
  'JAVELIN': 76.00,
};

export function isFieldEvent(event: TrackAndFieldEvent): boolean {
  return ['LONG_JUMP', 'HIGH_JUMP', 'TRIPLE_JUMP', 'POLE_VAULT', 'SHOT_PUT', 'DISCUS', 'JAVELIN'].includes(event);
}

export function formatPerformanceValue(value: number, event: TrackAndFieldEvent): string {
  if (isFieldEvent(event)) {
    return `${value.toFixed(2)}m`;
  }
  // Track formatting
  if (value >= 60) {
    const mins = Math.floor(value / 60);
    const secs = (value % 60).toFixed(2);
    return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;
  }
  return `${value.toFixed(2)}s`;
}

export function usePerformance() {
  const performances = ref<RacePerformanceRecord[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const fetchPerformances = async (athleteId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const url = athleteId
        ? `${API_BASE_URL}/performances/?athlete=${athleteId}`
        : `${API_BASE_URL}/performances/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load performance records.');
      performances.value = await res.json();
    } catch (err: any) {
      error.value = err.message || 'Error fetching race performances.';
    } finally {
      loading.value = false;
    }
  };

  const createPerformance = async (payload: Partial<RacePerformanceRecord>) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE_URL}/performances/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
      }
      const saved: RacePerformanceRecord = await res.json();
      performances.value.unshift(saved);
      return saved;
    } catch (err: any) {
      error.value = err.message || 'Failed to submit performance result.';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Calculates athlete personal best for a given event and evaluates ASA benchmark deltas.
   */
  const evaluatePerformanceDelta = (
    athleteId: string,
    event: TrackAndFieldEvent,
    currentValue: number
  ): PerformanceDelta => {
    const field = isFieldEvent(event);
    const athleteResults = performances.value
      .filter((p) => p.athlete === athleteId && p.event === event)
      .map((p) => p.result_value);

    let personalBest = currentValue;
    let isNewPb = true;

    if (athleteResults.length > 0) {
      personalBest = field ? Math.max(...athleteResults) : Math.min(...athleteResults);
      isNewPb = field ? currentValue > personalBest : currentValue < personalBest;
    }

    const pbDelta = Number((currentValue - personalBest).toFixed(2));
    const asaStandard = ASA_SENIOR_STANDARDS_MALE[event];

    let asaDelta: number | undefined;
    let qualifies = false;

    if (asaStandard !== undefined) {
      asaDelta = Number((currentValue - asaStandard).toFixed(2));
      qualifies = field ? currentValue >= asaStandard : currentValue <= asaStandard;
    }

    return {
      current_result: currentValue,
      personal_best: personalBest,
      pb_delta: pbDelta,
      is_new_pb: isNewPb,
      asa_standard_mark: asaStandard,
      asa_delta: asaDelta,
      qualifies_for_asa: qualifies,
    };
  };

  return {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
    evaluatePerformanceDelta,
  };
}