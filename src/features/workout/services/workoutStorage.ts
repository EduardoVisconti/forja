import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/core/supabase/client';
import { recordDeletion } from '@/features/sync/services/deletedRecordsStorage';
import type { Exercise, UserPreferences, WorkoutTemplate } from '../types';
import type { SetLog } from '../types/session';

// ─── Storage keys ────────────────────────────────────────────────────────────

const keys = {
  templates: (userId: string) => `workout:templates:${userId}`,
  exercises: (templateId: string) => `workout:exercises:${templateId}`,
  preferences: (userId: string) => `user:preferences:${userId}`,
  seeded: (userId: string) => `workout:seeded:${userId}`,
};

type StoredWorkoutTemplate = Omit<WorkoutTemplate, 'type' | 'order_index' | 'orderIndex'> & {
  type: WorkoutTemplate['type'] | 'stability' | 'flexibility' | 'warmup';
  order_index?: number;
  orderIndex?: number;
};

function normalizeTemplateType(type: StoredWorkoutTemplate['type']): WorkoutTemplate['type'] {
  if (type === 'stability' || type === 'flexibility' || type === 'warmup') {
    return 'functional';
  }

  return type;
}

// ─── ID generator ────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseRepsForVolume(reps: string): number {
  // "8-12" -> 12 (take higher number)
  if (reps.includes('-')) {
    const parts = reps.split('-').map((p) => parseFloat(p.trim()));
    return Math.max(...parts.filter((n) => !isNaN(n)));
  }
  // "30s" or "30 seconds" -> 0 (ignore in volume)
  if (reps.toLowerCase().includes('s')) return 0;
  // "10" -> 10
  const n = parseFloat(reps);
  return isNaN(n) ? 0 : n;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const raw = await AsyncStorage.getItem(keys.templates(userId));
  if (!raw) return [];

  const parsed = JSON.parse(raw) as StoredWorkoutTemplate[];
  return parsed
    .map((template) => {
      const order =
        typeof template.order_index === 'number'
          ? template.order_index
          : typeof template.orderIndex === 'number'
            ? template.orderIndex
            : 0;

      return {
        ...template,
        type: normalizeTemplateType(template.type),
        order_index: order,
        orderIndex: order,
      };
    })
    .sort((a, b) => a.order_index - b.order_index);
}

export async function saveTemplates(userId: string, templates: WorkoutTemplate[]): Promise<void> {
  const normalized = templates.map((template, index) => {
    const order =
      typeof template.order_index === 'number'
        ? template.order_index
        : typeof template.orderIndex === 'number'
          ? template.orderIndex
          : index;

    return {
      ...template,
      order_index: order,
      orderIndex: order,
    };
  });

  await AsyncStorage.setItem(keys.templates(userId), JSON.stringify(normalized));
}

export async function createTemplate(
  userId: string,
  data: Pick<WorkoutTemplate, 'name' | 'type'>,
): Promise<WorkoutTemplate> {
  const templates = await getTemplates(userId);
  const template: WorkoutTemplate = {
    id: generateId(),
    userId,
    name: data.name,
    type: data.type,
    order_index: templates.length,
    orderIndex: templates.length,
    createdAt: new Date().toISOString(),
  };
  await saveTemplates(userId, [...templates, template]);
  return template;
}

export async function updateTemplate(
  userId: string,
  id: string,
  data: Partial<Pick<WorkoutTemplate, 'name' | 'type'>>,
): Promise<void> {
  const templates = await getTemplates(userId);
  const updated = templates.map((t) => (t.id === id ? { ...t, ...data } : t));
  await saveTemplates(userId, updated);
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await recordDeletion(userId, id, 'workout_templates');
  const templates = await getTemplates(userId);
  const filtered = templates.filter((t) => t.id !== id);
  // Re-index order after deletion
  const reindexed = filtered.map((t, i) => ({ ...t, order_index: i, orderIndex: i }));
  await saveTemplates(userId, reindexed);
  // Clean up associated exercises
  await AsyncStorage.removeItem(keys.exercises(id));
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export async function getExercises(templateId: string): Promise<Exercise[]> {
  const raw = await AsyncStorage.getItem(keys.exercises(templateId));
  if (!raw) return [];

  const parsed = JSON.parse(raw) as Array<Exercise & { weightUnit?: Exercise['weightUnit'] }>;
  return parsed.map((exercise) => ({
    ...exercise,
    weightUnit: exercise.weightUnit ?? 'kg',
  }));
}

export async function saveExercises(templateId: string, exercises: Exercise[]): Promise<void> {
  await AsyncStorage.setItem(keys.exercises(templateId), JSON.stringify(exercises));
}

export async function updateExerciseWeightsFromSession(
  userId: string,
  templateId: string,
  setLogs: SetLog[],
): Promise<void> {
  void userId;
  const exercises = await getExercises(templateId);
  if (exercises.length === 0) return;

  // Group logs by exercise and keep the latest encountered set entry.
  const lastSetByExercise = new Map<string, SetLog>();
  for (const log of setLogs) {
    lastSetByExercise.set(log.exerciseId, log);
  }

  let updated = false;
  const updatedExercises = exercises.map((exercise) => {
    const lastSet = lastSetByExercise.get(exercise.id);
    if (!lastSet) return exercise;

    const newWeight =
      exercise.weightUnit === 'lbs'
        ? Math.round(lastSet.weightKg * 2.20462 * 10) / 10
        : Math.round(lastSet.weightKg * 10) / 10;

    if (newWeight === exercise.weight) return exercise;

    updated = true;
    return { ...exercise, weight: newWeight };
  });

  if (updated) {
    await saveExercises(templateId, updatedExercises);
  }
}

export async function addExercise(
  templateId: string,
  data: Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>,
): Promise<Exercise> {
  const exercises = await getExercises(templateId);
  const exercise: Exercise = {
    id: generateId(),
    templateId,
    orderIndex: exercises.length,
    ...data,
  };
  await saveExercises(templateId, [...exercises, exercise]);
  return exercise;
}

export async function updateExercise(
  templateId: string,
  id: string,
  data: Partial<Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>>,
): Promise<void> {
  const exercises = await getExercises(templateId);
  const updated = exercises.map((e) => (e.id === id ? { ...e, ...data } : e));
  await saveExercises(templateId, updated);
}

export async function deleteExercise(userId: string, templateId: string, id: string): Promise<void> {
  await recordDeletion(userId, id, 'exercises');
  const exercises = await getExercises(templateId);
  const filtered = exercises.filter((e) => e.id !== id);
  const reindexed = filtered.map((e, i) => ({ ...e, orderIndex: i }));
  await saveExercises(templateId, reindexed);
}

export async function reorderExercise(
  templateId: string,
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  const exercises = await getExercises(templateId);
  const index = exercises.findIndex((e) => e.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= exercises.length) return;

  const reordered = [...exercises];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  const reindexed = reordered.map((e, i) => ({ ...e, orderIndex: i }));
  await saveExercises(templateId, reindexed);
}

// ─── User preferences ────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(keys.preferences(userId));
  return raw ? (JSON.parse(raw) as UserPreferences) : { unit: 'kg' };
}

export async function saveUserPreferences(
  userId: string,
  prefs: UserPreferences,
): Promise<void> {
  await AsyncStorage.setItem(keys.preferences(userId), JSON.stringify(prefs));
}

// ─── Seed data ───────────────────────────────────────────────────────────────

type SeedExercise = Omit<Exercise, 'id' | 'templateId' | 'orderIndex' | 'weightUnit'> & {
  weightUnit?: Exercise['weightUnit'];
};

const SEED_TEMPLATES: Array<{
  name: string;
  type: 'gym' | 'cardio';
  exercises: SeedExercise[];
}> = [
  {
    name: 'Push',
    type: 'gym',
    exercises: [
      { name: 'Supino Reto', sets: 4, reps: '8', weight: 80, restSeconds: 90, notes: '' },
      { name: 'Supino Inclinado', sets: 3, reps: '10', weight: 60, restSeconds: 75, notes: '' },
      { name: 'Desenvolvimento', sets: 3, reps: '10', weight: 50, restSeconds: 90, notes: '' },
      { name: 'Elevação Lateral', sets: 3, reps: '15', weight: 10, restSeconds: 60, notes: '' },
      { name: 'Extensão Tríceps', sets: 3, reps: '12', weight: 30, restSeconds: 60, notes: '' },
    ],
  },
  {
    name: 'Pull',
    type: 'gym',
    exercises: [
      { name: 'Barra Fixa', sets: 4, reps: '8', weight: 0, restSeconds: 90, notes: 'Peso corporal' },
      { name: 'Remada Curvada', sets: 4, reps: '8', weight: 70, restSeconds: 90, notes: '' },
      { name: 'Puxada Frontal', sets: 3, reps: '10', weight: 60, restSeconds: 75, notes: '' },
      { name: 'Rosca Direta', sets: 3, reps: '12', weight: 20, restSeconds: 60, notes: '' },
      { name: 'Face Pull', sets: 3, reps: '15', weight: 15, restSeconds: 60, notes: '' },
    ],
  },
  {
    name: 'Legs',
    type: 'gym',
    exercises: [
      { name: 'Agachamento', sets: 4, reps: '8', weight: 100, restSeconds: 120, notes: '' },
      { name: 'Leg Press', sets: 3, reps: '12', weight: 120, restSeconds: 90, notes: '' },
      { name: 'Stiff', sets: 3, reps: '10', weight: 80, restSeconds: 90, notes: '' },
      { name: 'Cadeira Flexora', sets: 3, reps: '12', weight: 40, restSeconds: 60, notes: '' },
      { name: 'Panturrilha', sets: 4, reps: '20', weight: 60, restSeconds: 45, notes: '' },
    ],
  },
];

export async function seedDefaultTemplates(userId: string): Promise<void> {
  const alreadySeeded = await AsyncStorage.getItem(keys.seeded(userId));
  if (alreadySeeded) return;

  const existingTemplates = await getTemplates(userId);
  if (existingTemplates.length > 0) {
    await AsyncStorage.setItem(keys.seeded(userId), 'true');
    return;
  }

  const { data } = await supabase
    .from('workout_templates')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (data && data.length > 0) {
    await AsyncStorage.setItem(keys.seeded(userId), 'true');
    return;
  }

  for (let ti = 0; ti < SEED_TEMPLATES.length; ti++) {
    const seed = SEED_TEMPLATES[ti];
    const template: WorkoutTemplate = {
      id: generateId(),
      userId,
      name: seed.name,
      type: seed.type,
      order_index: ti,
      orderIndex: ti,
      createdAt: new Date().toISOString(),
    };

    const templates = await getTemplates(userId);
    await saveTemplates(userId, [...templates, template]);

    const exercises: Exercise[] = seed.exercises.map((ex, ei) => ({
      id: generateId(),
      templateId: template.id,
      orderIndex: ei,
      ...ex,
      weightUnit: ex.weightUnit ?? 'kg',
    }));
    await saveExercises(template.id, exercises);
  }

  await AsyncStorage.setItem(keys.seeded(userId), 'true');
}
