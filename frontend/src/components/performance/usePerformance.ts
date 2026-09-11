/**
 * @fileoverview Domain Composable: Race Performance & ASA Benchmark Deltas.
 * @module frontend/src/components/performance/usePerformance
 *
 * Manages competition performance records, calculates gaps against Athletics South Africa
 * (ASA) national qualification targets, and provides track/field formatting utilities.
 */

import { ref } from 'vue';
import { apiFetch } from '../../utils/api';
import type { RacePerformanceRecord } from './types';

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

/**
 * Formats a raw mark (seconds) into standard athletics time notation (mm:ss.ms or ss.ms).
 *
 * @param rawVal - Numeric seconds or formatted string.
 */
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

  /**
   * Fetches race performances from DRF with optional athlete filtering.
   *
   * @param athleteId - Optional target athlete UUID.
   */
  const fetchPerformances = async (athleteId?: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const endpoint = athleteId ? `/performances/?athlete=${athleteId}` : `/performances/`;
      performances.value = await apiFetch<RacePerformanceRecord[]>(endpoint);
    } catch (err: any) {
      error.value = err.message || 'Error fetching race performances.';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Submits a newly recorded race mark and stores it in PostgreSQL.
   *
   * @param payload - Performance result payload matching DRF serializer schema.
   */
  const createPerformance = async (payload: Partial<RacePerformanceRecord>): Promise<RacePerformanceRecord> => {
    loading.value = true;
    error.value = null;
    try {
      const saved = await apiFetch<RacePerformanceRecord>('/performances/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
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