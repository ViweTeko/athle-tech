/**
 * frontend/src/components/attendance/useAttendance.ts
 *
 * Vue 3 composable managing Attendance Logging state, API communications,
 * and sRPE workload / ACWR ratio calculations against the Django REST API.
 */

import { ref, computed } from 'vue'

export interface AttendanceRecord {
  id?: string
  /** Athlete UUID */
  athlete: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED'
  session_type: 'TRACK' | 'LONG_RUN' | 'TEMPO' | 'STRENGTH' | 'RECOVERY'
  duration_minutes: number
  /** Rate of Perceived Exertion (1–10) */
  rpe: number
  /** Computed backend property: duration_minutes × rpe */
  session_workload?: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export function useAttendance() {
  const logs = ref<AttendanceRecord[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const sessionDate = ref(new Date().toISOString().split('T')[0])
  const globalSessionType = ref<AttendanceRecord['session_type']>('TRACK')
  const globalDuration = ref(60)

  /**
   * Fetch all attendance logs from the Django REST backend.
   * Can optionally be filtered by athlete UUID.
   */
  const fetchLogs = async (athleteId?: string) => {
    loading.value = true
    error.value = null
    try {
      const url = athleteId
        ? `${API_BASE_URL}/attendance/?athlete=${athleteId}`
        : `${API_BASE_URL}/attendance/`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch logs: ${response.statusText}`)
      logs.value = await response.json()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading attendance records'
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(JSON.stringify(errData))
      }
      const newRecord: AttendanceRecord = await response.json()
      logs.value.unshift(newRecord)
      return newRecord
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error saving attendance record'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply the global session type and duration to all PRESENT entries in the local log list.
   */
  function applyGlobalSettings() {
    logs.value.forEach((entry) => {
      entry.session_type = globalSessionType.value
      if (entry.status === 'PRESENT') {
        entry.duration_minutes = globalDuration.value
      }
    })
  }

  // ─── ACWR Helpers ─────────────────────────────────────────────────────────

  /**
   * Calculates the Acute-to-Chronic Workload Ratio for two raw workload values.
   * Returns 0 if the chronic value is zero to prevent division-by-zero errors.
   */
  function calculateACWR(acute: number, chronic: number): number {
    if (!chronic || chronic === 0) return 0
    return Number((acute / chronic).toFixed(2))
  }

  /**
   * Returns a Tailwind CSS class string for an ACWR badge based on injury-risk thresholds.
   * - Green  (0.8–1.3) : Safe training zone
   * - Yellow (1.3–1.5) : Caution zone
   * - Red    (>1.5)    : High injury risk
   * - Blue   (<0.8)    : Under-training / detraining zone
   */
  function getACWRBadgeClass(acwr: number): string {
    if (acwr > 1.5) return 'bg-red-100 text-red-800 border-red-200'
    if (acwr >= 0.8 && acwr <= 1.3) return 'bg-green-100 text-green-800 border-green-200'
    if (acwr > 1.3 && acwr <= 1.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  // ─── Computed Workload Metrics ─────────────────────────────────────────────

  /**
   * Computes Acute Workload: the rolling 7-day sum of sRPE (duration × RPE).
   */
  const acuteWorkload = computed(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return logs.value
      .filter((log) => new Date(log.date) >= sevenDaysAgo && log.status === 'PRESENT')
      .reduce((sum, log) => sum + (log.session_workload ?? log.duration_minutes * log.rpe), 0)
  })

  /**
   * Computes Chronic Workload: the average weekly sRPE over the past 28 days.
   */
  const chronicWorkload = computed(() => {
    const twentyEightDaysAgo = new Date()
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)
    const total = logs.value
      .filter((log) => new Date(log.date) >= twentyEightDaysAgo && log.status === 'PRESENT')
      .reduce((sum, log) => sum + (log.session_workload ?? log.duration_minutes * log.rpe), 0)
    return total / 4
  })

  /**
   * Acute-to-Chronic Workload Ratio (ACWR).
   * Safe range: 0.8–1.3 | High injury risk: >1.5
   */
  const acwrRatio = computed(() => {
    if (chronicWorkload.value === 0) return 0
    return parseFloat((acuteWorkload.value / chronicWorkload.value).toFixed(2))
  })

  /** Count of attendance entries currently marked as PRESENT. */
  const totalPresent = computed(() =>
    logs.value.filter((e) => e.status === 'PRESENT').length
  )

  /**
   * Count of log entries exceeding the high-risk ACWR threshold (>1.5).
   * Uses per-entry sRPE against the chronic average as a proxy.
   */
  const highRiskCount = computed(() => {
    const chronic = chronicWorkload.value / (logs.value.length || 1)
    return logs.value.filter((e) => {
      const acute = e.session_workload ?? e.duration_minutes * e.rpe
      return calculateACWR(acute, chronic) > 1.5
    }).length
  })

  return {
    // Reactive state
    logs,
    loading,
    error,
    sessionDate,
    globalSessionType,
    globalDuration,
    // API actions
    fetchLogs,
    logAttendance,
    applyGlobalSettings,
    // ACWR helpers
    calculateACWR,
    getACWRBadgeClass,
    // Computed metrics
    acuteWorkload,
    chronicWorkload,
    acwrRatio,
    totalPresent,
    highRiskCount,
  }
}