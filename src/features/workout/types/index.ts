export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'gym' | 'cardio';
  orderIndex: number;
  createdAt: string;
}

export interface Exercise {
  id: string;
  templateId: string;
  name: string;
  sets: number;
  reps: number;
  /** Always stored in kg */
  weight: number;
  restSeconds: number;
  notes: string;
  orderIndex: number;
}

export interface UserPreferences {
  unit: 'kg' | 'lbs';
}
