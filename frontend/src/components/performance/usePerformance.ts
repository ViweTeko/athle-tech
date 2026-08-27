/**
 * frontend/src/components/performance/usePerformance.ts
 *
 * Vue 3 composable managing Race Performance tracking state, REST API communications,
 * and calculations comparing athlete times against ASA national qualifying standards.
 */

import { ref, computed } from 'vue'

export interface RacePerformanceRecord {
  id?: string
  /** Athlete UUID */
  athlete: string
  event_name: '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '10km' | '21.1km'
  date: string
  recorded_time_seconds: number
  asa_standard_seconds: number
  /** Computed backend property: recorded_time_seconds − asa_standard_seconds */
  delta_seconds?: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export function usePerformance() {
  const performances = ref<RacePerformanceRecord[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all race performance records from the Django REST API.
   * Can optionally filter by athlete UUID or specific event category.
   */
  const fetchPerformances = async (athleteId?: string, eventName?: string) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      if (athleteId) queryParams.append('athlete', athleteId)
      if (eventName) queryParams.append('event_name', eventName)
      const queryString = queryParams.toString()
      const url = queryString
        ? `${API_BASE_URL}/performance/?${queryString}`
        : `${API_BASE_URL}/performance/`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch race performances: ${response.statusText}`)
      performances.value = await response.json()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading performance records'
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit a new race performance record to the Django REST backend.
   */
  const addPerformance = async (record: Omit<RacePerformanceRecord, 'id' | 'delta_seconds'>) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/performance/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(JSON.stringify(errData))
      }
      const newRecord: RacePerformanceRecord = await response.json()
      performances.value.unshift(newRecord)
      return newRecord
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error recording race performance'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Returns the athlete's personal best (lowest recorded time) for a specific event.
   */
  const getPersonalBest = (eventName: string): number | null => {
    const eventRecords = performances.value.filter((p) => p.event_name === eventName)
    if (eventRecords.length === 0) return null
    return Math.min(...eventRecords.map((p) => p.recorded_time_seconds))
  }

  /**
   * Computes the average gap in seconds against ASA qualifying standards.
   * Negative values indicate performance faster than the national standard.
   */
  const averageAsaDelta = computed(() => {
    if (performances.value.length === 0) return 0
    const totalDelta = performances.value.reduce((sum, p) => {
      const delta = p.delta_seconds ?? (p.recorded_time_seconds - p.asa_standard_seconds)
      return sum + delta
    }, 0)
    return parseFloat((totalDelta / performances.value.length).toFixed(2))
  })

  // ─── Display Helpers ───────────────────────────────────────────────────────

  /**
   * Converts a total-seconds value to a human-readable MM:SS.ms string.
   * @example formatSecondsToTime(112.4) → "1:52.40"
   */
  function formatSecondsToTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60)
    const secs = (totalSeconds % 60).toFixed(2)
    return mins > 0
      ? `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`
      : `${secs}s`
  }

  /**
   * Calculates the display delta between a recorded time and its ASA target.
   * @returns { seconds: "+4.40s", percentage: 96.1 }
   */
  function calculateDelta(
    recorded: number,
    target: number
  ): { seconds: string; percentage: number } {
    const diff = recorded - target
    const percentage = Math.min(Number(((target / recorded) * 100).toFixed(1)), 100)
    return {
      seconds: diff > 0 ? `+${diff.toFixed(2)}s` : `${diff.toFixed(2)}s`,
      percentage,
    }
  }

  return {
    performances,
    loading,
    error,
    fetchPerformances,
    addPerformance,
    getPersonalBest,
    averageAsaDelta,
    formatSecondsToTime,
    calculateDelta,
  }
}