export type CardioType = 'regenerative' | 'intervals' | 'long' | 'walk' | null;
export type CardioZone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | null;

export interface CardioLog {
  id: string;
  userId: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  trainingType: CardioType;
  zone: CardioZone;
  durationMinutes: number;
  /** Always stored in km */
  distanceKm: number;
  /** User-entered string e.g. "5:30" — in their chosen unit's pace */
  avgPace: string;
  avgHr: number | null;
  notes: string;
  createdAt: string;
}
