/**
 * @fileoverview Defines type definitions and interfaces for the
 * Performance & Delta Tracker module (Screen 3).
 */

/**
 * Supported track and road race event categories.
 */
export type EventCategory = '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '10km' | '21.1km'

/**
 * Represents a logged race performance result compared to national benchmarks.
 */
export interface RaceResult {
    /** Unique identifier of the race result */
    id: string
    /** Unique identifier of the athlete */
    athleteId: string
    /** Full name of the athlete */
    athleteName: string
    /** Event category for the race */
    eventName: EventCategory
    /** Date when the performance was recorded */
    date: string
    /** Recorded time in seconds (e.g. 112.40 for 1m 52.40s) */
    recordedTimeSeconds: number
    /** ASA target benchmark qualifying standard in seconds */
    asaStandardSeconds: number
}