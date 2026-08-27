/**
 * frontend/src/performance/types.ts
 *
 * Types for multi-event performance tracking and ASA benchmark deltas.
 */

export type TrackAndFieldEvent =
    // Sprints & Hurdles
    | '100M'
    | '200M'
    | '400M'
    | '100MH'
    | '110MH'
    | '400MH'
    // Middle & Long Distance
    | '800M'
    | '1500M'
    | '3000M'
    | '5000M'
    | '10000M'
    | 'HALF_MARATHON'
    | 'MARATHON'
    // Jumps & Throws
    | 'LONG_JUMP'
    | 'HIGH_JUMP'
    | 'TRIPLE_JUMP'
    | 'POLE_VAULT'
    | 'SHOT_PUT'
    | 'DISCUS'
    | 'JAVELIN';

export type EventCategory = 'TRACK' | 'FIELD';

export interface RacePerformanceRecord {
    id: string;
    athlete: string; // UUID
    athlete_name?: string;
    event: TrackAndFieldEvent;
    result_value: number; // Seconds for track, meters for field
    result_display: string; // e.g., "10.45s", "03:42.10", "7.85m"
    competition_name: string;
    competition_date: string;
    wind_reading?: number | null; // e.g. +1.2 m/s
    is_personal_best?: boolean;
    notes?: string;
    created_at?: string;
}

export interface AsaStandard {
    event: TrackAndFieldEvent;
    gender: 'M' | 'F';
    category: 'YOUTH' | 'JUNIOR' | 'SENIOR';
    qualifying_mark: number; // Seconds or meters
    display_mark: string;
}

export interface PerformanceDelta {
    current_result: number;
    personal_best: number;
    pb_delta: number; // Negative = faster (track) or worse (field)
    is_new_pb: boolean;
    asa_standard_mark?: number;
    asa_delta?: number; // Delta against ASA national qualifying benchmark
    qualifies_for_asa: boolean;
}