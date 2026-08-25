/**
 * frontend/src/components/performance/usePerformance.ts
 *
 * Vue 3 composable managing Race Performance tracking state, REST API communications,
 * and calculations comparing athlete times against ASA (Athletics South Africa) national standards.
 */

import { ref, computed } from 'vue'

export interface RacePerformanceRecord {
    id?: string
    athlete: string // Athlete UUID
    event_name: '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '10km' | '21.1km'
    date: string
    recorded_time_seconds: number
    asa_standard_seconds: number
    delta_seconds?: number // Computed backend property: recorded - standard
}

const API_BASE_URL = 'http://127.0.0.1:8000/api'

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
            if (!response.ok) {
                throw new Error(`Failed to fetch race performances: ${response.statusText}`)
            }
            performances.value = await response.json()
        } catch (err: any) {
            error.value = err.message || 'Error loading performance records'
        } finally {
            loading.value = false
        }
    }

    /**
     * Submit a new race performance record to the Django REST backend.
     */
    const addPerformance = async (
        record: Omit<RacePerformanceRecord, 'id' | 'delta_seconds'>
    ) => {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`${API_BASE_URL}/performance/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(record),
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(JSON.stringify(errData))
            }

            const newRecord: RacePerformanceRecord = await response.json()
            performances.value.unshift(newRecord)
            return newRecord
        } catch (err: any) {
            error.value = err.message || 'Error recording race performance'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Calculates the athlete's personal best (PB) time in seconds for a specific event.
     */
    const getPersonalBest = (eventName: string): number | null => {
        const eventRecords = performances.value.filter((p) => p.event_name === eventName)
        if (eventRecords.length === 0) return null
        return Math.min(...eventRecords.map((p) => p.recorded_time_seconds))
    }

    /**
     * Computes average gap in seconds against ASA qualifying standards across all logged races.
     * Negative values indicate running faster than the national standard.
     */
    const averageAsaDelta = computed(() => {
        if (performances.value.length === 0) return 0
        const totalDelta = performances.value.reduce((sum, p) => {
            const delta = p.delta_seconds ?? (p.recorded_time_seconds - p.asa_standard_seconds)
            return sum + delta
        }, 0)
        return parseFloat((totalDelta / performances.value.length).toFixed(2))
    })

    return {
        performances,
        loading,
        error,
        fetchPerformances,
        addPerformance,
        getPersonalBest,
        averageAsaDelta,
    }
}