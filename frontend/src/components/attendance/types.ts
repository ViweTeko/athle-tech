/**
 * @fileoverview Defines type definitions, enums, and interfaces
 * for the Attendance & Workload Logger module (Screen 2).
 */

/**
 * Types of athletic training sessions.
 */
export type SessionType = 'TRACK' | 'TEMPO' | 'GYM' | 'LONG_RUN'

/**
 * Possible attendance statuses for an athlete during a session.
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'INJURED'

/**
 * Represents an attendance and workload tracking entry for a single athlete.
 */
export interface AttendanceEntry {
  /** Unique identifier of the athlete */
  athleteId: string
  /** Full name of the athlete */
  fullName: string
  /** Age or experience category of the athlete */
  category: string
  /** Category of training session */
  sessionType: SessionType
  /** Attendance marker for the current session */
  status: AttendanceStatus
  /** Total duration in minutes of the session */
  durationMinutes: number
  /** Rate of Perceived Exertion (RPE), ranked 1-10 */
  rpe: number
  /** Rolling 7-day workload total sum (rpe * duration) */
  acute7DaySum: number
  /** Weekly average workload total calculated over the past 28 days */
  chronic28DayAvg: number
}