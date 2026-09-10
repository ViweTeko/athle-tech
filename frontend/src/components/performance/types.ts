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
    | 'HURDLES'
    // Middle & Long Distance
    | '800M'
    | '1500M'
    | '3000M'
    | '5000M'
    | '10 KM'
    | '21.1 KM'
    | 'MARATHON'
    // Jumps & Throws
    | 'JUMPS'
    | 'THROWS';

export type EventCategory = 'TRACK' | 'FIELD';

export interface RacePerformanceRecord {
    id: string;
    athlete: string; // UUID
    event_name: string;
    date: string;
    recorded_time_seconds: string | number;
    asa_standard_seconds: string | number;
    delta_seconds: number;
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