/**
 * frontend/src/composables/useAttendance.ts
 *
 * Vue 3 Composable for fetching attendance records and calculating 
 * Acute:Chronic Workload Ratios (ACWR) for athletes using a 28-day rolling window.
 *
 * ACWR Formula:
 * - Acute Workload   = Sum of daily workload over the last 7 days / 7
 * - Chronic Workload = Sum of daily workload over the last 28 days / 28
 * - ACWR             = Acute Workload / Chronic Workload
 */

import { ref, computed } from 'vue';

export interface AttendanceRecord {
  id: string;
  athlete: string; // Athlete UUID or ID
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'INJURED';
  srpe: number | null;
  duration_minutes: number;
  workload: number; // sRPE * duration_minutes
  notes?: string;
}

export interface ACWRMetrics {
  acuteWorkload: number;   // 7-day rolling average AU
  chronicWorkload: number; // 28-day rolling average AU
  acwr: number;            // Acute : Chronic ratio
  status: 'UNDERTRAINED' | 'SWEET_SPOT' | 'HIGH_RISK' | 'EXTREME_RISK';
  statusLabel: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function useAttendance() {
  const attendanceLogs = ref<AttendanceRecord[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Fetch attendance logs from Django REST API.
   * Accepts an optional athleteId to filter logs per athlete.
   */
  const fetchAttendance = async (athleteId?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const url = athleteId
        ? `${API_BASE_URL}/attendance/?athlete=${athleteId}`
        : `${API_BASE_URL}/attendance/`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}: Failed to fetch attendance data.`);

      const data: AttendanceRecord[] = await res.json();
      attendanceLogs.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load attendance logs.';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Calculate ACWR and workload stats for a specific athlete over a target date (default: today).
   */
  const calculateACWR = (athleteId: string, referenceDateStr?: string): ACWRMetrics => {
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

    // Boundary dates
    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(refDate.getDate() - 7);

    const twentyEightDaysAgo = new Date(refDate);
    twentyEightDaysAgo.setDate(refDate.getDate() - 28);

    // Filter athlete records within the 28-day window
    const athleteLogs = attendanceLogs.value.filter((log) => {
      if (log.athlete !== athleteId) return false;
      const logDate = new Date(log.date);
      return logDate >= twentyEightDaysAgo && logDate <= refDate;
    });

    // 1. Calculate Acute Workload (Last 7 Days)
    const acuteLogs = athleteLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);
    const totalAcuteWorkload = acuteLogs.reduce((sum, log) => sum + (log.workload || 0), 0);
    const acuteWorkload = Math.round(totalAcuteWorkload / 7);

    // 2. Calculate Chronic Workload (Last 28 Days)
    const totalChronicWorkload = athleteLogs.reduce((sum, log) => sum + (log.workload || 0), 0);
    const chronicWorkload = Math.round(totalChronicWorkload / 28);

    // 3. Calculate ACWR Ratio
    // Protect against division by zero if chronic workload is 0
    const rawAcwr = chronicWorkload > 0 ? acuteWorkload / chronicWorkload : 0;
    const acwr = Number(rawAcwr.toFixed(2));

    // 4. Classify ACWR Risk Zone (Gabbett ACWR Framework)
    let status: ACWRMetrics['status'] = 'SWEET_SPOT';
    let statusLabel = 'Optimal Load (0.8 - 1.3)';

    if (acwr < 0.8) {
      status = 'UNDERTRAINED';
      statusLabel = 'Under-trained (< 0.8)';
    } else if (acwr >= 0.8 && acwr <= 1.3) {
      status = 'SWEET_SPOT';
      statusLabel = 'Sweet Spot (0.8 - 1.3)';
    } else if (acwr > 1.3 && acwr <= 1.5) {
      status = 'HIGH_RISK';
      statusLabel = 'Elevated Risk (1.3 - 1.5)';
    } else {
      status = 'EXTREME_RISK';
      statusLabel = 'High Injury Danger (> 1.5)';
    }

    return {
      acuteWorkload,
      chronicWorkload,
      acwr,
      status,
      statusLabel,
    };
  };

  return {
    attendanceLogs,
    loading,
    error,
    fetchAttendance,
    calculateACWR,
  };
}