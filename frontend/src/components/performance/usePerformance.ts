/**
 * frontend/src/components/performance/usePerformance.ts
 */

import { ref } from 'vue';
import type { RacePerformanceRecord } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const ASA_SENIOR_STANDARDS_MALE: Record<string, number> = {
  '100m': 10.30,
  '200m': 20.70,
  '400m': 46.20,
  '800m': 107.50, // 1:47.50
  '1500m': 222.00, // 3:42.00
  '5000m': 830.00, // 13:50.00
  '10km': 1740.00, // 29:00.00
  '21.1km': 3780.00, // 1:03:00
};

export function formatPerformanceValue(rawVal: string | number | undefined): string {
  if (rawVal === undefined || rawVal === null) return '--';
  const val = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;
  if (isNaN(val)) return '--';

  if (val >= 60) {
    const mins = Math.floor(val / 60);
    const secs = (val % 60).toFixed(2);
    return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;
  }
  return `${val.toFixed(2)}s`;
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

  return {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
  };
}