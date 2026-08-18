export type AgeCategory = 'U16' | 'U18' | 'U20' | 'SENIOR';

export type PrimaryDiscipline = 'TRACK_FIELD' | 'CROSS_COUNTRY' | 'ROAD';

export interface Athlete {
  athlete_id: string;
  full_name: string;
  age_category: AgeCategory;
  primary_discipline: PrimaryDiscipline;
  created_at: string;
}

export type DisciplineFilter = 'ALL' | PrimaryDiscipline;

export const DISCIPLINE_LABELS: Record<PrimaryDiscipline, string> = {
  TRACK_FIELD: 'Track & Field',
  CROSS_COUNTRY: 'Cross Country',
  ROAD: 'Road Racing',
};

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  U16: 'Under 16',
  U18: 'Under 18',
  U20: 'Under 20',
  SENIOR: 'Senior',
};
