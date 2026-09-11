/**
 * @fileoverview Domain Composable: Workload Analytics & ACWR Engine.
 * @module frontend/src/analytics/useAnalytics
 *
 * Provides reactive state management and authenticated API communication for
 * continuous 28-day athletic workload telemetry, Tim Gabbett's Acute:Chronic
 * Workload Ratio (ACWR) calculations, and risk zone classifications.
 */

import { ref } from 'vue';
import { apiFetch } from '../utils/api';

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

export function useAnalytics() {
    const analyticsData = ref<AnalyticsResponse | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    /**
     * Fetches computed 28-day workload metrics and rolling window telemetry for a specified athlete.
     *
     * @param athleteId - Target athlete UUID v4.
     * @param refDate - Optional ISO date string (YYYY-MM-DD) serving as timeline anchor.
     */
    const fetchAthleteAnalytics = async (athleteId: string, refDate?: string): Promise<void> => {
        if (!athleteId) return;

        loading.value = true;
        error.value = null;

        try {
            const endpoint = refDate
                ? `/analytics/workload/${athleteId}/?date=${refDate}`
                : `/analytics/workload/${athleteId}/`;

            analyticsData.value = await apiFetch<AnalyticsResponse>(endpoint);
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