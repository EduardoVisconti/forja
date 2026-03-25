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

const templateKey = (userId: string) => `workout:templates:${userId}`;
const exercisesKey = (templateId: string) => `workout:exercises:${templateId}`;
const sessionsKey = (userId: string) => `workout:sessions:${userId}`;
const setLogsKey = (sessionId: string) => `workout:setlogs:${sessionId}`;
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

async function isMissingOrEmptyArray(key: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return true;

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
}

async function saveIfMissingOrEmpty(key: string, value: unknown[]): Promise<void> {
  if (await isMissingOrEmptyArray(key)) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
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
  const templatesStorageKey = templateKey(userId);
  if (await isMissingOrEmptyArray(templatesStorageKey)) {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('id, user_id, name, type, order_index, created_at')
      .eq('user_id', userId);
    if (error) throw error;

    const templates = (data ?? [])
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

    await saveIfMissingOrEmpty(templatesStorageKey, templates);
  }

  const templates = await workoutStorage.getTemplates(userId);
  const templateIdsToPull: string[] = [];
  for (const template of templates) {
    if (await isMissingOrEmptyArray(exercisesKey(template.id))) {
      templateIdsToPull.push(template.id);
    }
  }

  if (templateIdsToPull.length > 0) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, template_id, name, sets, reps, weight, rest_seconds, notes, order_index')
      .eq('user_id', userId)
      .in('template_id', templateIdsToPull);
    if (error) throw error;

    const byTemplate = new Map<string, Array<Record<string, unknown>>>();
    for (const row of data ?? []) {
      const list = byTemplate.get(row.template_id) ?? [];
      list.push({
        id: row.id,
        templateId: row.template_id,
        name: row.name,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
        restSeconds: row.rest_seconds,
        notes: row.notes ?? '',
        orderIndex: row.order_index,
      });
      byTemplate.set(row.template_id, list);
    }

    for (const templateId of templateIdsToPull) {
      const exercises = (byTemplate.get(templateId) ?? []).sort(
        (a, b) => Number(a.orderIndex) - Number(b.orderIndex),
      );
      await saveIfMissingOrEmpty(exercisesKey(templateId), exercises);
    }
  }

  const sessionsStorageKey = sessionsKey(userId);
  if (await isMissingOrEmptyArray(sessionsStorageKey)) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(
        'id, user_id, template_id, template_name, started_at, finished_at, duration_minutes, total_volume_kg',
      )
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    if (error) throw error;

    const sessions = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      templateId: row.template_id,
      templateName: row.template_name,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      durationMinutes: row.duration_minutes,
      totalVolumeKg: row.total_volume_kg,
    }));

    await saveIfMissingOrEmpty(sessionsStorageKey, sessions);
  }

  const sessions = await sessionStorage.getAllSessions(userId);
  const sessionIdsToPull: string[] = [];
  for (const session of sessions) {
    if (await isMissingOrEmptyArray(setLogsKey(session.id))) {
      sessionIdsToPull.push(session.id);
    }
  }

  if (sessionIdsToPull.length > 0) {
    const { data, error } = await supabase
      .from('set_logs')
      .select(
        'id, session_id, exercise_id, exercise_name, set_number, reps_done, weight_kg, completed_at',
      )
      .in('session_id', sessionIdsToPull);
    if (error) throw error;

    const bySession = new Map<string, Array<Record<string, unknown>>>();
    for (const row of data ?? []) {
      const list = bySession.get(row.session_id) ?? [];
      list.push({
        id: row.id,
        sessionId: row.session_id,
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name,
        setNumber: row.set_number,
        repsDone: row.reps_done,
        weightKg: row.weight_kg,
        completedAt: row.completed_at,
      });
      bySession.set(row.session_id, list);
    }

    for (const sessionId of sessionIdsToPull) {
      await saveIfMissingOrEmpty(setLogsKey(sessionId), bySession.get(sessionId) ?? []);
    }
  }

  const cardioStorageKey = cardioLogsKey(userId);
  if (await isMissingOrEmptyArray(cardioStorageKey)) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .select(
        'id, user_id, date, training_type, zone, duration_minutes, distance_km, avg_pace, avg_hr, notes, created_at',
      )
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;

    const cardioLogs = (data ?? []).map((row) => ({
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

    await saveIfMissingOrEmpty(cardioStorageKey, cardioLogs);
  }

  const checksStorageKey = habitChecksKey(userId);
  if (await isMissingOrEmptyArray(checksStorageKey)) {
    const { data, error } = await supabase
      .from('habit_checks')
      .select('id, user_id, date, score, total_active, habits, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;

    const checks = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      score: row.score,
      totalActive: row.total_active,
      habits: Array.isArray(row.habits) ? row.habits : [],
      createdAt: row.created_at,
    }));

    await saveIfMissingOrEmpty(checksStorageKey, checks);
  }

  const configStorageKey = habitConfigKey(userId);
  if (await isMissingOrEmptyArray(configStorageKey)) {
    const { data, error } = await supabase
      .from('habit_configs')
      .select('id, user_id, label, emoji, active')
      .eq('user_id', userId);
    if (error) throw error;

    const configs = (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      emoji: row.emoji ?? '',
      active: row.active ?? true,
    }));

    await saveIfMissingOrEmpty(configStorageKey, configs);
  }
}
