export type CardioCategory =
  | 'regenerative'
  | 'intervals'
  | 'long'
  | 'walk'
  | 'z1'
  | 'z2'
  | 'z3'
  | 'z4'
  | 'z5';

export interface CardioLog {
  id: string;
  userId: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  category: CardioCategory;
  durationMinutes: number;
  /** Always stored in km */
  distanceKm: number;
  /** User-entered string e.g. "5:30" — in their chosen unit's pace */
  avgPace: string;
  avgHr: number | null;
  notes: string;
  createdAt: string;
}
