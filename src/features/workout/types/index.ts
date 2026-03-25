export type TemplateType = 'gym' | 'cardio' | 'functional';

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  type: TemplateType;
  order_index: number;
  /** Backward-compatible alias for older local objects. */
  orderIndex: number;
  createdAt: string;
}

export interface Exercise {
  id: string;
  templateId: string;
  name: string;
  sets: number;
  reps: string;
  /** Always stored in kg */
  weight: number;
  restSeconds: number;
  notes: string;
  orderIndex: number;
}

export interface UserPreferences {
  unit: 'kg' | 'lbs';
}
