/**
 * frontend/src/components/attendance/useAttendance.ts
 *
 * Vue 3 composable managing Attendance Logging state, API communications,
 * and sRPE workload / ACWR ratio calculations against the Django REST API.
 */

import { ref, computed } from 'vue'

export interface AttendanceRecord {
  id?: string
  athlete: string // Athlete UUID
  date: string
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED'
  session_type: 'TRACK' | 'LONG_RUN' | 'TEMPO' | 'STRENGTH' | 'RECOVERY'
  duration_minutes: number
  rpe: number
  session_workload?: number
}

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export function useAttendance() {
  const logs = ref<AttendanceRecord[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all attendance logs from the Django REST backend.
   */
  const fetchLogs = async (athleteId?: string) => {
    loading.value = true
    error.value = null
    try {
      const url = athleteId
        ? `${API_BASE_URL}/attendance/?athlete=${athleteId}`
        : `${API_BASE_URL}/attendance/`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`)
      }
      logs.value = await response.json()
    } catch (err: any) {
      error.value = err.message || 'Error loading attendance records'
    } finally {
      loading.value = false
    }
  }

  /**
   * Submit a new daily attendance log to the backend.
   */
  const logAttendance = async (record: Omit<AttendanceRecord, 'id' | 'session_workload'>) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/`, {
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

      const newRecord: AttendanceRecord = await response.json()
      logs.value.unshift(newRecord)
      return newRecord
    } catch (err: any) {
      error.value = err.message || 'Error saving attendance record'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Computes Acute Workload (7-day sum of sRPE workload).
   */
  const acuteWorkload = computed(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return logs.value
      .filter((log) => new Date(log.date) >= sevenDaysAgo && log.status === 'PRESENT')
      .reduce((sum, log) => sum + (log.session_workload || log.duration_minutes * log.rpe), 0)
  })

  /**
   * Computes Chronic Workload (28-day average 7-day workload).
   */
  const chronicWorkload = computed(() => {
    const twentyEightDaysAgo = new Date()
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)

    const total28DayLoad = logs.value
      .filter((log) => new Date(log.date) >= twentyEightDaysAgo && log.status === 'PRESENT')
      .reduce((sum, log) => sum + (log.session_workload || log.duration_minutes * log.rpe), 0)

    return total28DayLoad / 4
  })

  /**
   * Acute-to-Chronic Workload Ratio (ACWR).
   * Safe range: 0.8 - 1.3 | High injury risk: > 1.5
   */
  const acwrRatio = computed(() => {
    if (chronicWorkload.value === 0) return 0
    return parseFloat((acuteWorkload.value / chronicWorkload.value).toFixed(2))
  })

  return {
    logs,
    loading,
    error,
    fetchLogs,
    logAttendance,
    acuteWorkload,
    chronicWorkload,
    acwrRatio,
  }
}