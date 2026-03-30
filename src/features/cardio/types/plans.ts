export type ActivityType = 'running' | 'cycling' | 'swimming';
export type PlanStatus = 'pending' | 'completed' | 'skipped';

export interface CardioPlan {
  id: string;
  userId: string;
  activityType: ActivityType;
  title: string;
  trainingType: string | null;
  /** ISO date: YYYY-MM-DD */
  plannedDate: string;
  /** km */
  targetDistance: number | null;
  /** mm:ss */
  targetDuration: string | null;
  targetZone: string | null;
  targetPace: string | null;
  notes: string | null;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedRecordId: string | null;
}

export interface CardioRecord {
  id: string;
  userId: string;
  /** null if created without a plan */
  planId: string | null;
  activityType: ActivityType;
  trainingType: string | null;
  /** ISO date: YYYY-MM-DD */
  performedAt: string;
  /** mm:ss as typed */
  duration: string | null;
  distanceKm: number | null;
  avgPace: string | null;
  avgHr: number | null;
  zone: string | null;
  notes: string | null;
  /** 1-10 RPE */
  perceivedEffort: number | null;
  createdAt: string;
  updatedAt: string;
}
