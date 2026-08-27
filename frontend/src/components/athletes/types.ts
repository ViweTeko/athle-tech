/**
 * @fileoverview Defines type definitions, interfaces, and lookup labels
 * for the Athlete management and Roster Engine features.
 */

/**
 * Gender category matching backend choices.
 */
export type GenderCategory = 'M' | 'F';

/**
 * Primary discipline/event matching backend choices.
 */
export type PrimaryEvent =
  | 'SPRINTS'
  | 'MIDDLE'
  | 'LONG'
  | 'HURDLES'
  | 'JUMPS'
  | 'THROWS';

/**
 * Athlete status matching backend choices.
 */
export type RosterStatus = 'ACTIVE' | 'INJURED' | 'RESTING' | 'INACTIVE';

/**
 * Represents a registered athlete on the roster retrieved from PostgreSQL.
 */
export interface Athlete {
  /** Unique UUID v4 identifying the athlete */
  id: string;
  /** Athlete's first name */
  first_name: string;
  /** Athlete's last name */
  last_name: string;
  /** Date of birth (YYYY-MM-DD) */
  date_of_birth: string;
  /** Gender: 'M' or 'F' */
  gender: GenderCategory;
  /** Primary focus event category */
  primary_event: PrimaryEvent;
  /** Active status on roster */
  status: RosterStatus;
  /** Date string when the athlete was registered */
  created_at: string;
  /** Date string when the athlete was updated */
  updated_at: string;
}

/**
 * User-friendly labels for primary event categories.
 */
export const PRIMARY_EVENT_LABELS: Record<PrimaryEvent, string> = {
  SPRINTS: 'Sprints (100m-400m)',
  MIDDLE: 'Middle Distance (800m-1500m)',
  LONG: 'Long Distance (5000m-Marathon)',
  HURDLES: 'Hurdles',
  JUMPS: 'Jumps',
  THROWS: 'Throws',
};

/**
 * User-friendly labels for athlete status.
 */
export const STATUS_LABELS: Record<RosterStatus, string> = {
  ACTIVE: 'Active',
  INJURED: 'Injured',
  RESTING: 'Resting',
  INACTIVE: 'Inactive',
};
