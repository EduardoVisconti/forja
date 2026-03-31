import type { Exercise } from './index';

export type SessionStatus = 'idle' | 'active' | 'resting';

export interface SessionExercise extends Exercise {
  skipped: boolean;
}

export interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  repsDone: number;
  /** Always stored in kg */
  weightKg: number;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  /** Sum of (repsDone × weightKg) across all sets */
  totalVolumeKg: number;
  /** True when the session is added retroactively by the user. */
  isManual?: boolean;
}
