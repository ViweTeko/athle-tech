/**
 * @fileoverview Domain Composable: Attendance & Workload Logger.
 * @module frontend/src/components/attendance/useAttendance
 *
 * Encapsulates CRUD operations for daily session logs and provides client-side
 * fallback calculations for Acute:Chronic Workload Ratios (ACWR).
 */

import { ref } from 'vue';
import { apiFetch } from '../../utils/api';

export type SessionType = 'TRACK' | 'LONG_RUN' | 'TEMPO' | 'STRENGTH' | 'RECOVERY';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface AttendanceRecord {
  id?: string;
  athlete: string; // Athlete UUID
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  session_type: SessionType;
  duration_minutes: number;
  rpe: number; // Borg CR10 (1-10)
  session_workload?: number; // Computed AU (duration * rpe)
  notes?: string;
}

export interface ACWRMetrics {
  acuteWorkload: number;
  chronicWorkload: number;
  acwr: number;
  status: 'UNDERTRAINED' | 'SWEET_SPOT' | 'HIGH_RISK' | 'EXTREME_RISK';
  statusLabel: string;
}

export function useAttendance() {
  const attendanceLogs = ref<AttendanceRecord[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Retrieves attendance records from the backend with optional athlete filtering.
   *
   * @param athleteId - Optional target athlete UUID.
   */
  const fetchAttendance = async (athleteId?: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const endpoint = athleteId ? `/attendance/?athlete=${athleteId}` : `/attendance/`;
      attendanceLogs.value = await apiFetch<AttendanceRecord[]>(endpoint);
    } catch (err: any) {
      error.value = err.message || 'Failed to load attendance logs.';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Computes client-side ACWR metrics for an athlete over a 28-day historical window.
   *
   * @param athleteId - Target athlete UUID.
   * @param referenceDateStr - Target timeline anchor (YYYY-MM-DD).
   */
  const calculateACWR = (athleteId: string, referenceDateStr?: string): ACWRMetrics => {
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(refDate.getDate() - 7);

    const twentyEightDaysAgo = new Date(refDate);
    twentyEightDaysAgo.setDate(refDate.getDate() - 28);

    const athleteLogs = attendanceLogs.value.filter((log) => {
      if (log.athlete !== athleteId || log.status !== 'PRESENT') return false;
      const logDate = new Date(log.date);
      return logDate >= twentyEightDaysAgo && logDate <= refDate;
    });

    // 1. Acute Workload (7 Days)
    const acuteLogs = athleteLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);
    const totalAcuteWorkload = acuteLogs.reduce(
      (sum, log) => sum + (log.session_workload ?? log.duration_minutes * log.rpe),
      0
    );
    const acuteWorkload = Math.round(totalAcuteWorkload / 7);

    // 2. Chronic Workload (28 Days)
    const totalChronicWorkload = athleteLogs.reduce(
      (sum, log) => sum + (log.session_workload ?? log.duration_minutes * log.rpe),
      0
    );
    const chronicWorkload = Math.round(totalChronicWorkload / 28);

    // 3. ACWR Ratio
    const rawAcwr = chronicWorkload > 0 ? acuteWorkload / chronicWorkload : 0;
    const acwr = Number(rawAcwr.toFixed(2));

    // 4. Classify Risk Zone
    let status: ACWRMetrics['status'] = 'SWEET_SPOT';
    let statusLabel = 'Optimal Load (0.8 - 1.3)';

    if (acwr < 0.8) {
      status = 'UNDERTRAINED';
      statusLabel = 'Under-trained (< 0.8)';
    } else if (acwr <= 1.3) {
      status = 'SWEET_SPOT';
      statusLabel = 'Sweet Spot (0.8 - 1.3)';
    } else if (acwr <= 1.5) {
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