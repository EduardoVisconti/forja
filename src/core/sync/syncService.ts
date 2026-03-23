/**
 * Sync service: reads AsyncStorage and upserts to Supabase.
 * AsyncStorage is source of truth; Supabase is write-through backup.
 * Strategy: last-write-wins using updated_at.
 * Never imports React hooks or stores.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/core/supabase/client';
import * as workoutStorage from '@/features/workout/services/workoutStorage';
import * as sessionStorage from '@/features/workout/services/sessionStorage';
import * as cardioStorage from '@/features/cardio/services/cardioStorage';
import * as habitStorage from '@/features/habits/services/habitStorage';

const habitConfigKey = (userId: string) => `habits:config:${userId}`;

export async function syncAll(userId: string): Promise<void> {
  const now = new Date().toISOString();

  const templates = await workoutStorage.getTemplates(userId);
  if (templates.length > 0) {
    const rows = templates.map((t) => ({
      id: t.id,
      user_id: t.userId,
      name: t.name,
      type: t.type,
      order_index: t.orderIndex,
      created_at: t.createdAt,
      updated_at: now,
    }));
    await supabase.from('workout_templates').upsert(rows, { onConflict: 'id' });
  }

  for (const t of templates) {
    const exercises = await workoutStorage.getExercises(t.id);
    if (exercises.length > 0) {
      const rows = exercises.map((e) => ({
        id: e.id,
        template_id: e.templateId,
        user_id: userId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        rest_seconds: e.restSeconds,
        notes: e.notes ?? '',
        order_index: e.orderIndex,
        updated_at: now,
      }));
      await supabase.from('exercises').upsert(rows, { onConflict: 'id' });
    }
  }

  const sessions = await sessionStorage.getAllSessions(userId);
  if (sessions.length > 0) {
    const sessionRows = sessions.map((s) => ({
      id: s.id,
      user_id: s.userId,
      template_id: s.templateId,
      template_name: s.templateName,
      started_at: s.startedAt,
      finished_at: s.finishedAt,
      duration_minutes: s.durationMinutes,
      total_volume_kg: s.totalVolumeKg,
      updated_at: now,
    }));
    await supabase.from('workout_sessions').upsert(sessionRows, { onConflict: 'id' });

    for (const s of sessions) {
      const logs = await sessionStorage.getSetLogs(s.id);
      if (logs.length > 0) {
        const logRows = logs.map((l) => ({
          id: l.id,
          session_id: l.sessionId,
          exercise_id: l.exerciseId,
          exercise_name: l.exerciseName,
          set_number: l.setNumber,
          reps_done: l.repsDone,
          weight_kg: l.weightKg,
          completed_at: l.completedAt,
          updated_at: now,
        }));
        await supabase.from('set_logs').upsert(logRows, { onConflict: 'id' });
      }
    }
  }

  const cardioLogs = await cardioStorage.getLogs(userId);
  if (cardioLogs.length > 0) {
    const rows = cardioLogs.map((l) => ({
      id: l.id,
      user_id: l.userId,
      date: l.date,
      training_type: l.trainingType,
      zone: l.zone,
      duration_minutes: l.durationMinutes,
      distance_km: l.distanceKm,
      avg_pace: l.avgPace ?? '',
      avg_hr: l.avgHr,
      notes: l.notes ?? '',
      created_at: l.createdAt,
      updated_at: now,
    }));
    await supabase.from('cardio_logs').upsert(rows, { onConflict: 'id' });
  }

  const habitChecks = await habitStorage.getChecks(userId);
  if (habitChecks.length > 0) {
    const rows = habitChecks.map((c) => ({
      id: c.id,
      user_id: c.userId,
      date: c.date,
      score: c.score,
      total_active: c.totalActive,
      habits: c.habits,
      created_at: c.createdAt,
      updated_at: now,
    }));
    await supabase.from('habit_checks').upsert(rows, { onConflict: 'id' });
  }

  const configRaw = await AsyncStorage.getItem(habitConfigKey(userId));
  if (configRaw) {
    const configs = JSON.parse(configRaw) as Array<{
      id: string;
      label: string;
      emoji: string;
      active: boolean;
    }>;
    if (configs.length > 0) {
      const rows = configs.map((c) => ({
        id: c.id,
        user_id: userId,
        label: c.label,
        emoji: c.emoji ?? '',
        active: c.active ?? true,
        updated_at: now,
      }));
      await supabase.from('habit_configs').upsert(rows, { onConflict: 'id' });
    }
  }
}
