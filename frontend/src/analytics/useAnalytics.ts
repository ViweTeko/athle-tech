/**
 * frontend/src/analytics/useAnalytics.ts
 *
 * Composable for communicating with backend ACWR workload analytics API.
 */

import { ref } from 'vue';

export interface DailyTrendPoint {
    date: string;
    date_label: string;
    workload: number;
    rpe: number | null;
    duration_minutes: number;
    status: string;
    is_acute_window: boolean;
}

export interface ACWRMetrics {
    acute_workload: number;
    chronic_workload: number;
    acwr: number;
    status: 'UNDERTRAINED' | 'SWEET_SPOT' | 'HIGH_RISK' | 'EXTREME_RISK';
    status_label: string;
}

export interface AnalyticsResponse {
    athlete_id: string;
    athlete_name: string;
    reference_date: string;
    metrics: ACWRMetrics;
    daily_trend: DailyTrendPoint[];
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function useAnalytics() {
    const analyticsData = ref<AnalyticsResponse | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const fetchAthleteAnalytics = async (athleteId: string, refDate?: string) => {
        if (!athleteId) return;

        loading.value = true;
        error.value = null;

        try {
            const url = refDate
                ? `${API_BASE_URL}/analytics/workload/${athleteId}/?date=${refDate}`
                : `${API_BASE_URL}/analytics/workload/${athleteId}/`;

            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Athlete not found.');
                throw new Error(`Server returned status ${res.status}`);
            }

            analyticsData.value = await res.json();
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch analytics metrics.';
            analyticsData.value = null;
        } finally {
            loading.value = false;
        }
    };

    return {
        analyticsData,
        loading,
        error,
        fetchAthleteAnalytics,
    };
}