/**
 * @fileoverview Defines the type definitions, interfaces, and lookup labels
 * for the Athlete management and Roster Engine features.
 */

/**
 * Supported age divisions for athletic classification.
 */
export type AgeCategory = 'U16' | 'U18' | 'U20' | 'SENIOR';

/**
 * Primary track and road racing disciplines for categorization.
 */
export type PrimaryDiscipline = 'TRACK_FIELD' | 'CROSS_COUNTRY' | 'ROAD';

/**
 * Represeents a registered athlete on the roster.
 */
export interface Athlete {
  /** Unique UUID v4 identifying the athlete */
  athlete_id: string;
  /** Full name of the athlete */
  full_name: string;
  /** Age category classification */
  age_category: AgeCategory;
  /** Primary focus discipline */
  primary_discipline: PrimaryDiscipline;
  /** ISO Date string when the record was created */
  created_at: string;
}

/**
 * Filter option representing either a specific discipline or all disciplines.
 */
export type DisciplineFilter = 'ALL' | PrimaryDiscipline;

/**
 * User-facing labels for the PrimaryDiscipline keys.
 */
export const DISCIPLINE_LABELS: Record<PrimaryDiscipline, string> = {
  TRACK_FIELD: 'Track & Field',
  CROSS_COUNTRY: 'Cross Country',
  ROAD: 'Road Racing',
};

/**
 * User-facing labels for the AgeCategory keys.
 */
export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  U16: 'Under 16',
  U18: 'Under 18',
  U20: 'Under 20',
  SENIOR: 'Senior',
};
