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

const sessionsKey = (userId: string) => `workout:sessions:${userId}`;
const cardioLogsKey = (userId: string) => `cardio:logs:${userId}`;
const habitChecksKey = (userId: string) => `habits:checks:${userId}`;
const habitConfigKey = (userId: string) => `habits:config:${userId}`;

function durationTextToMinutes(input: string): number {
  const value = input.trim();
  if (!value) return 0;

  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;

  return 0;
}

function minutesToDurationText(input: number): string {
  if (!Number.isFinite(input)) return '';
  const totalSeconds = Math.max(0, Math.round(input * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (seconds === 0) {
    return String(minutes);
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function syncAll(userId: string): Promise<void> {
  const now = new Date().toISOString();

  const templates = await workoutStorage.getTemplates(userId);
  if (templates.length > 0) {
    const rows = templates.map((t) => ({
      id: t.id,
      user_id: t.userId,
      name: t.name,
      type: t.type,
      order_index: t.order_index,
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
      duration_minutes: durationTextToMinutes(l.duration),
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

export async function pullAll(userId: string): Promise<void> {
  const { data: templatesData, error: templatesError } = await supabase
    .from('workout_templates')
    .select('id, user_id, name, type, order_index, created_at')
    .eq('user_id', userId)
    .order('order_index', { ascending: true });
  if (templatesError) throw templatesError;

  const localTemplates = await workoutStorage.getTemplates(userId);
  const remoteTemplates = (templatesData ?? [])
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      order_index: row.order_index,
      orderIndex: row.order_index,
      createdAt: row.created_at,
    }))
    .sort((a, b) => a.order_index - b.order_index);

  const localTemplateIds = new Set(localTemplates.map((template) => template.id));
  const missingTemplates = remoteTemplates.filter((template) => !localTemplateIds.has(template.id));
  if (missingTemplates.length > 0) {
    const mergedTemplates = [...localTemplates, ...missingTemplates].sort(
      (a, b) => a.order_index - b.order_index,
    );
    await workoutStorage.saveTemplates(userId, mergedTemplates);
  }

  const allTemplateIds = remoteTemplates.map((template) => template.id);
  if (allTemplateIds.length > 0) {
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, template_id, name, sets, reps, weight, rest_seconds, notes, order_index')
      .eq('user_id', userId)
      .in('template_id', allTemplateIds);
    if (exercisesError) throw exercisesError;

    const byTemplate: Record<
      string,
      Array<{
        id: string;
        template_id: string;
        name: string;
        sets: number;
        reps: string;
        weight: number;
        rest_seconds: number;
        notes: string | null;
        order_index: number;
      }>
    > = {};
    for (const row of exercisesData ?? []) {
      if (!byTemplate[row.template_id]) {
        byTemplate[row.template_id] = [];
      }
      byTemplate[row.template_id].push(row);
    }

    for (const [templateId, remoteExercises] of Object.entries(byTemplate)) {
      const localExercises = await workoutStorage.getExercises(templateId);
      const localExerciseIds = new Set(localExercises.map((exercise) => exercise.id));
      const missingExercises = remoteExercises
        .filter((exercise) => !localExerciseIds.has(exercise.id))
        .map((exercise) => ({
          id: exercise.id,
          templateId: exercise.template_id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          restSeconds: exercise.rest_seconds,
          notes: exercise.notes ?? '',
          orderIndex: exercise.order_index,
        }));

      if (missingExercises.length > 0) {
        const mergedExercises = [...localExercises, ...missingExercises].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        await workoutStorage.saveExercises(templateId, mergedExercises);
      }
    }
  }

  const { data: sessionsData, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select(
      'id, user_id, template_id, template_name, started_at, finished_at, duration_minutes, total_volume_kg',
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (sessionsError) throw sessionsError;

  const localSessions = await sessionStorage.getAllSessions(userId);
  const remoteSessions = (sessionsData ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    templateName: row.template_name,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMinutes: row.duration_minutes,
    totalVolumeKg: row.total_volume_kg,
  }));
  const localSessionIds = new Set(localSessions.map((session) => session.id));
  const missingSessions = remoteSessions.filter((session) => !localSessionIds.has(session.id));
  if (missingSessions.length > 0) {
    const mergedSessions = [...localSessions, ...missingSessions].sort(
      (a, b) => b.startedAt.localeCompare(a.startedAt),
    );
    await AsyncStorage.setItem(sessionsKey(userId), JSON.stringify(mergedSessions));
  }

  const sessionIds = remoteSessions.map((session) => session.id);
  if (sessionIds.length > 0) {
    const { data: setLogsData, error: setLogsError } = await supabase
      .from('set_logs')
      .select('id, session_id, exercise_id, exercise_name, set_number, reps_done, weight_kg, completed_at')
      .in('session_id', sessionIds);
    if (setLogsError) throw setLogsError;

    const bySession: Record<
      string,
      Array<{
        id: string;
        session_id: string;
        exercise_id: string;
        exercise_name: string;
        set_number: number;
        reps_done: number;
        weight_kg: number;
        completed_at: string;
      }>
    > = {};
    for (const row of setLogsData ?? []) {
      if (!bySession[row.session_id]) {
        bySession[row.session_id] = [];
      }
      bySession[row.session_id].push(row);
    }

    for (const [sessionId, remoteSetLogs] of Object.entries(bySession)) {
      const localSetLogs = await sessionStorage.getSetLogs(sessionId);
      const localSetLogIds = new Set(localSetLogs.map((log) => log.id));
      const missingSetLogs = remoteSetLogs
        .filter((log) => !localSetLogIds.has(log.id))
        .map((log) => ({
          id: log.id,
          sessionId: log.session_id,
          exerciseId: log.exercise_id,
          exerciseName: log.exercise_name,
          setNumber: log.set_number,
          repsDone: log.reps_done,
          weightKg: log.weight_kg,
          completedAt: log.completed_at,
        }));

      if (missingSetLogs.length > 0) {
        await sessionStorage.saveSetLogs(sessionId, [...localSetLogs, ...missingSetLogs]);
      }
    }
  }

  const { data: cardioData, error: cardioError } = await supabase
    .from('cardio_logs')
    .select(
      'id, user_id, date, training_type, zone, duration_minutes, distance_km, avg_pace, avg_hr, notes, created_at',
    )
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (cardioError) throw cardioError;

  const localCardioLogs = await cardioStorage.getLogs(userId);
  const remoteCardioLogs = (cardioData ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    trainingType: row.training_type,
    zone: row.zone,
    duration: minutesToDurationText(row.duration_minutes),
    distanceKm: row.distance_km,
    avgPace: row.avg_pace ?? '',
    avgHr: row.avg_hr,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }));
  const localCardioIds = new Set(localCardioLogs.map((log) => log.id));
  const missingCardioLogs = remoteCardioLogs.filter((log) => !localCardioIds.has(log.id));
  if (missingCardioLogs.length > 0) {
    const mergedCardioLogs = [...localCardioLogs, ...missingCardioLogs].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    await AsyncStorage.setItem(cardioLogsKey(userId), JSON.stringify(mergedCardioLogs));
  }

  const { data: checksData, error: checksError } = await supabase
    .from('habit_checks')
    .select('id, user_id, date, score, total_active, habits, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (checksError) throw checksError;

  const localChecks = await habitStorage.getChecks(userId);
  const remoteChecks = (checksData ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    score: row.score,
    totalActive: row.total_active,
    habits: Array.isArray(row.habits) ? row.habits : [],
    createdAt: row.created_at,
  }));
  const localCheckIds = new Set(localChecks.map((check) => check.id));
  const missingChecks = remoteChecks.filter((check) => !localCheckIds.has(check.id));
  if (missingChecks.length > 0) {
    const mergedChecks = [...localChecks, ...missingChecks].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    await AsyncStorage.setItem(habitChecksKey(userId), JSON.stringify(mergedChecks));
  }

  const { data: configData, error: configError } = await supabase
    .from('habit_configs')
    .select('id, user_id, label, emoji, active')
    .eq('user_id', userId);
  if (configError) throw configError;

  const localConfigs = (await habitStorage.getConfig(userId)) ?? [];
  const remoteConfigs = (configData ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    emoji: row.emoji ?? '',
    active: row.active ?? true,
  }));
  const localConfigIds = new Set(localConfigs.map((config) => config.id));
  const missingConfigs = remoteConfigs.filter((config) => !localConfigIds.has(config.id));
  if (missingConfigs.length > 0) {
    await habitStorage.saveConfig(userId, [...localConfigs, ...missingConfigs]);
  }
}
