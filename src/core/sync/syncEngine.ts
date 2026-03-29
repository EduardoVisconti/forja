/**
 * Sync engine: pushes local storage data to Supabase and pulls remote data into local storage.
 * Sync logic depends only on storage service APIs.
 */
import { supabase } from '@/core/supabase/client';
import {
  getAllSessions,
  getChecks,
  getConfig,
  getExercises,
  getLogs,
  getSetLogs,
  getTemplates,
  saveAllSessions,
  saveChecks,
  saveConfig,
  saveExercises,
  saveLogs,
  saveSetLogs,
  saveTemplates,
  setOnboardingComplete,
  setStoredUserName,
} from '@/core/storage';
import { reportSyncStatus } from './syncStatusReporter';

type TemplateType = 'gym' | 'cardio' | 'functional';
type CardioTrainingType = 'regenerative' | 'intervals' | 'long' | 'walk' | 'strong' | null;
type CardioZone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | null;
type HabitCheckItem = Array<{ habitId: string; checked: boolean }>;

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

function inFilter(ids: string[]): string {
  const escaped = ids.map((id) => `"${id.replace(/"/g, '\\"')}"`);
  return `(${escaped.join(',')})`;
}

function timestampFrom(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveLocalTimestamp(record: unknown): string | null | undefined {
  if (!record || typeof record !== 'object') return undefined;
  const values = record as Record<string, unknown>;
  const timestamp =
    values.updatedAt ?? values.updated_at ?? values.createdAt ?? values.created_at ?? undefined;
  return typeof timestamp === 'string' ? timestamp : undefined;
}

function isRemoteUpdatedAtNewer(
  remoteUpdatedAt: string | null | undefined,
  localRecord: unknown,
): boolean {
  return timestampFrom(remoteUpdatedAt) > timestampFrom(resolveLocalTimestamp(localRecord));
}

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const message = [e.message, e.code, e.details, e.hint].filter(Boolean).join(' | ');
    return new Error(message || JSON.stringify(err));
  }
  return new Error(String(err));
}

function reportAndBuildError(scope: string, error: unknown): Error {
  const normalized = normalizeError(error);
  console.error(`[SyncEngine] ${scope}`, normalized);
  reportSyncStatus('error');
  return normalized;
}

async function runSupabaseCall<T>(
  scope: string,
  operation: () => PromiseLike<{ data: T | null; error: unknown | null }>,
): Promise<T | null> {
  try {
    const { data, error } = await operation();
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throw reportAndBuildError(scope, error);
  }
}

type SyncExercise = {
  id: string;
  templateId: string;
  name: string;
  sets: number;
  reps: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  restSeconds: number;
  notes: string;
  orderIndex: number;
  updatedAt?: string;
};

type SyncCardioLog = {
  id: string;
  userId: string;
  date: string;
  trainingType: CardioTrainingType;
  zone: CardioZone;
  duration: string;
  distanceKm: number;
  avgPace: string;
  avgHr: number | null;
  notes: string;
  createdAt: string;
  updatedAt?: string;
};

type SyncHabitCheck = {
  id: string;
  userId: string;
  date: string;
  score: number;
  totalActive: number;
  habits: HabitCheckItem;
  createdAt: string;
  updatedAt?: string;
};

type SyncHabitConfig = {
  id: string;
  label: string;
  emoji: string;
  active: boolean;
  updatedAt?: string;
};

export async function syncAll(userId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.warn('[SyncEngine] syncAll aborted — no active session');
    return;
  }

  try {
    const now = new Date().toISOString();

    const templates = await getTemplates(userId);
    if (templates.length > 0) {
      const rows = templates.map((template) => ({
        id: template.id,
        user_id: template.userId,
        name: template.name,
        type: template.type,
        order_index: template.order_index,
        created_at: template.createdAt,
        updated_at: now,
      }));
      await runSupabaseCall('syncAll: upsert workout_templates', () =>
        supabase.from('workout_templates').upsert(rows, { onConflict: 'id' }),
      );
    }
    if (templates.length === 0) {
      await runSupabaseCall('syncAll: delete workout_templates for empty local set', () =>
        supabase.from('workout_templates').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale workout_templates', () =>
        supabase
          .from('workout_templates')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(templates.map((template) => template.id))),
      );
    }

    for (const template of templates) {
      const exercises = await getExercises(template.id);
      if (exercises.length > 0) {
        const rows = exercises.map((exercise) => ({
          id: exercise.id,
          template_id: exercise.templateId,
          user_id: userId,
          name: exercise.name,
          sets: exercise.sets,
          reps: String(exercise.reps),
          weight: exercise.weight,
          weight_unit: exercise.weightUnit,
          rest_seconds: exercise.restSeconds,
          notes: exercise.notes ?? '',
          order_index: exercise.orderIndex,
          updated_at: now,
        }));
        await runSupabaseCall(`syncAll: upsert exercises for template ${template.id}`, () =>
          supabase.from('exercises').upsert(rows, { onConflict: 'id' }),
        );
      }

      if (exercises.length === 0) {
        await runSupabaseCall(`syncAll: delete exercises for empty template ${template.id}`, () =>
          supabase.from('exercises').delete().eq('user_id', userId).eq('template_id', template.id),
        );
      } else {
        await runSupabaseCall(`syncAll: delete stale exercises for template ${template.id}`, () =>
          supabase
            .from('exercises')
            .delete()
            .eq('user_id', userId)
            .eq('template_id', template.id)
            .not('id', 'in', inFilter(exercises.map((exercise) => exercise.id))),
        );
      }
    }

    if (templates.length === 0) {
      await runSupabaseCall('syncAll: delete exercises when there are no templates', () =>
        supabase.from('exercises').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete exercises for removed templates', () =>
        supabase
          .from('exercises')
          .delete()
          .eq('user_id', userId)
          .not('template_id', 'in', inFilter(templates.map((template) => template.id))),
      );
    }

    const sessions = await getAllSessions(userId);
    if (sessions.length > 0) {
      const sessionRows = sessions.map((session) => ({
        id: session.id,
        user_id: session.userId,
        template_id: session.templateId,
        template_name: session.templateName,
        started_at: session.startedAt,
        finished_at: session.finishedAt,
        duration_minutes: session.durationMinutes,
        total_volume_kg: session.totalVolumeKg,
        updated_at: now,
      }));
      await runSupabaseCall('syncAll: upsert workout_sessions', () =>
        supabase.from('workout_sessions').upsert(sessionRows, { onConflict: 'id' }),
      );

      for (const session of sessions) {
        const logs = await getSetLogs(session.id);
        if (logs.length > 0) {
          const logRows = logs.map((log) => ({
            id: log.id,
            session_id: log.sessionId,
            exercise_id: log.exerciseId,
            exercise_name: log.exerciseName,
            set_number: log.setNumber,
            reps_done: log.repsDone,
            weight_kg: log.weightKg,
            completed_at: log.completedAt,
            updated_at: now,
          }));
          await runSupabaseCall(`syncAll: upsert set_logs for session ${session.id}`, () =>
            supabase.from('set_logs').upsert(logRows, { onConflict: 'id' }),
          );
        }
      }
    }

    const cardioLogs = await getLogs(userId);
    if (cardioLogs.length > 0) {
      const rows = cardioLogs.map((log) => ({
        id: log.id,
        user_id: log.userId,
        date: log.date,
        training_type: log.trainingType,
        zone: log.zone,
        duration_minutes: Math.round(durationTextToMinutes(log.duration) * 100) / 100,
        distance_km: log.distanceKm,
        avg_pace: log.avgPace ?? '',
        avg_hr: log.avgHr,
        notes: log.notes ?? '',
        created_at: log.createdAt,
        updated_at: now,
      }));
      await runSupabaseCall('syncAll: upsert cardio_logs', () =>
        supabase.from('cardio_logs').upsert(rows, { onConflict: 'id' }),
      );
    }
    if (cardioLogs.length === 0) {
      await runSupabaseCall('syncAll: delete cardio_logs for empty local set', () =>
        supabase.from('cardio_logs').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale cardio_logs', () =>
        supabase
          .from('cardio_logs')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(cardioLogs.map((log) => log.id))),
      );
    }

    const habitChecks = await getChecks(userId);
    if (habitChecks.length > 0) {
      const rows = habitChecks.map((check) => ({
        id: check.id,
        user_id: check.userId,
        date: check.date,
        score: check.score,
        total_active: check.totalActive,
        habits: check.habits,
        created_at: check.createdAt,
        updated_at: now,
      }));
      await runSupabaseCall('syncAll: upsert habit_checks', () =>
        supabase.from('habit_checks').upsert(rows, { onConflict: 'id' }),
      );
    }
    if (habitChecks.length === 0) {
      await runSupabaseCall('syncAll: delete habit_checks for empty local set', () =>
        supabase.from('habit_checks').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale habit_checks', () =>
        supabase
          .from('habit_checks')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(habitChecks.map((check) => check.id))),
      );
    }

    const configs = (await getConfig(userId)) ?? [];
    if (configs.length > 0) {
      const rows = configs.map((config) => ({
        id: config.id,
        user_id: userId,
        label: config.label,
        emoji: config.emoji ?? '',
        active: config.active ?? true,
        updated_at: now,
      }));
      await runSupabaseCall('syncAll: upsert habit_configs', () =>
        supabase.from('habit_configs').upsert(rows, { onConflict: 'id' }),
      );
    }

    if (configs.length === 0) {
      await runSupabaseCall('syncAll: delete habit_configs for empty local set', () =>
        supabase.from('habit_configs').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale habit_configs', () =>
        supabase
          .from('habit_configs')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(configs.map((config) => config.id))),
      );
    }
  } catch (error) {
    throw reportAndBuildError(`syncAll failed for user ${userId}`, error);
  }
}

export async function pullAll(userId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.warn('[SyncEngine] pullAll aborted — no active session');
    return;
  }

  try {
    const profile = await runSupabaseCall<{
      display_name: string | null;
      onboarding_complete: boolean | null;
    }>('pullAll: fetch user profile', () =>
      supabase
        .from('user_profiles')
        .select('display_name, onboarding_complete')
        .eq('id', userId)
        .maybeSingle(),
    );

    if (profile?.onboarding_complete) {
      await setOnboardingComplete(userId);
      if (profile.display_name) {
        await setStoredUserName(userId, profile.display_name);
      }
    }

    const templatesData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          name: string;
          type: TemplateType;
          order_index: number;
          created_at: string;
          updated_at: string | null;
        }>
      >('pullAll: fetch workout_templates', () =>
        supabase
          .from('workout_templates')
          .select('id, user_id, name, type, order_index, created_at, updated_at')
          .eq('user_id', userId)
          .order('order_index', { ascending: true }),
      )) ?? [];

    const localTemplates = await getTemplates(userId);
    const remoteTemplates = templatesData
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        order_index: row.order_index,
        orderIndex: row.order_index,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? undefined,
      }))
      .sort((a, b) => a.order_index - b.order_index);

    const localTemplatesById = new Map(localTemplates.map((template) => [template.id, template]));
    const mergedTemplates = remoteTemplates.map((remoteTemplate) => {
      const localTemplate = localTemplatesById.get(remoteTemplate.id);
      localTemplatesById.delete(remoteTemplate.id);

      if (!localTemplate) {
        return remoteTemplate;
      }

      return isRemoteUpdatedAtNewer(remoteTemplate.updatedAt, localTemplate)
        ? remoteTemplate
        : localTemplate;
    });
    mergedTemplates.push(...localTemplatesById.values());

    if (remoteTemplates.length > 0) {
      await saveTemplates(
        userId,
        mergedTemplates.sort((a, b) => a.order_index - b.order_index),
      );
    }

    const exercisesData =
      (await runSupabaseCall<
        Array<{
          id: string;
          template_id: string;
          name: string;
          sets: number;
          reps: string;
          weight: number;
          weight_unit: 'kg' | 'lbs' | null;
          rest_seconds: number;
          notes: string | null;
          order_index: number;
          updated_at: string | null;
        }>
      >('pullAll: fetch exercises', () =>
        supabase
          .from('exercises')
          .select(
            'id, template_id, name, sets, reps, weight, weight_unit, rest_seconds, notes, order_index, updated_at',
          )
          .eq('user_id', userId),
      )) ?? [];

    const byTemplate: Record<string, typeof exercisesData> = {};
    for (const row of exercisesData) {
      if (!byTemplate[row.template_id]) {
        byTemplate[row.template_id] = [];
      }
      byTemplate[row.template_id].push(row);
    }

    const allLocalTemplates = await getTemplates(userId);
    const allTemplateIdSet = new Set(allLocalTemplates.map((template) => template.id));

    for (const [templateId, remoteExercises] of Object.entries(byTemplate)) {
      if (!allTemplateIdSet.has(templateId)) continue;

      const localExercises = (await getExercises(templateId)) as SyncExercise[];
      const localExercisesById = new Map(localExercises.map((exercise) => [exercise.id, exercise]));
      const mergedExercises = remoteExercises.map((exercise) => {
        const remoteExercise: SyncExercise = {
          id: exercise.id,
          templateId: exercise.template_id,
          name: exercise.name,
          sets: exercise.sets,
          reps: String(exercise.reps),
          weight: exercise.weight,
          weightUnit: exercise.weight_unit ?? 'kg',
          restSeconds: exercise.rest_seconds,
          notes: exercise.notes ?? '',
          orderIndex: exercise.order_index,
          updatedAt: exercise.updated_at ?? undefined,
        };

        const localExercise = localExercisesById.get(exercise.id);
        localExercisesById.delete(exercise.id);
        if (!localExercise) {
          return remoteExercise;
        }

        return isRemoteUpdatedAtNewer(exercise.updated_at, localExercise)
          ? remoteExercise
          : localExercise;
      });
      mergedExercises.push(...localExercisesById.values());

      if (remoteExercises.length > 0) {
        await saveExercises(
          templateId,
          mergedExercises
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((exercise) => {
              const { updatedAt, ...rest } = exercise;
              return rest;
            }),
        );
      }
    }

    const sessionsData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          template_id: string;
          template_name: string;
          started_at: string;
          finished_at: string;
          duration_minutes: number;
          total_volume_kg: number;
        }>
      >('pullAll: fetch workout_sessions', () =>
        supabase
          .from('workout_sessions')
          .select(
            'id, user_id, template_id, template_name, started_at, finished_at, duration_minutes, total_volume_kg',
          )
          .eq('user_id', userId)
          .order('started_at', { ascending: false }),
      )) ?? [];

    const localSessions = await getAllSessions(userId);
    const remoteSessions = sessionsData.map((row) => ({
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
      const mergedSessions = [...localSessions, ...missingSessions].sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt),
      );
      await saveAllSessions(userId, mergedSessions);
    }

    const sessionIds = remoteSessions.map((session) => session.id);
    if (sessionIds.length > 0) {
      const setLogsData =
        (await runSupabaseCall<
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
        >('pullAll: fetch set_logs', () =>
          supabase
            .from('set_logs')
            .select(
              'id, session_id, exercise_id, exercise_name, set_number, reps_done, weight_kg, completed_at',
            )
            .in('session_id', sessionIds),
        )) ?? [];

      const bySession: Record<string, typeof setLogsData> = {};
      for (const row of setLogsData) {
        if (!bySession[row.session_id]) {
          bySession[row.session_id] = [];
        }
        bySession[row.session_id].push(row);
      }

      for (const [sessionId, remoteSetLogs] of Object.entries(bySession)) {
        const localSetLogs = await getSetLogs(sessionId);
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
          await saveSetLogs(sessionId, [...localSetLogs, ...missingSetLogs]);
        }
      }
    }

    const cardioData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          date: string;
          training_type: CardioTrainingType;
          zone: CardioZone;
          duration_minutes: number;
          distance_km: number;
          avg_pace: string | null;
          avg_hr: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        }>
      >('pullAll: fetch cardio_logs', () =>
        supabase
          .from('cardio_logs')
          .select(
            'id, user_id, date, training_type, zone, duration_minutes, distance_km, avg_pace, avg_hr, notes, created_at, updated_at',
          )
          .eq('user_id', userId)
          .order('date', { ascending: false }),
      )) ?? [];

    const localCardioLogs = (await getLogs(userId)) as SyncCardioLog[];
    const remoteCardioLogs: SyncCardioLog[] = cardioData.map((row) => ({
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
      updatedAt: row.updated_at ?? undefined,
    }));
    const localCardioById = new Map(localCardioLogs.map((log) => [log.id, log]));
    const mergedCardioLogs: SyncCardioLog[] = remoteCardioLogs.map((remoteLog) => {
      const localLog = localCardioById.get(remoteLog.id);
      localCardioById.delete(remoteLog.id);
      if (!localLog) {
        return remoteLog;
      }

      return isRemoteUpdatedAtNewer(remoteLog.updatedAt, localLog) ? remoteLog : localLog;
    });
    mergedCardioLogs.push(...localCardioById.values());
    if (remoteCardioLogs.length > 0) {
      await saveLogs(
        userId,
        mergedCardioLogs.sort((a, b) => b.date.localeCompare(a.date)),
      );
    }

    const checksData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          date: string;
          score: number;
          total_active: number;
          habits: HabitCheckItem;
          created_at: string;
          updated_at: string | null;
        }>
      >('pullAll: fetch habit_checks', () =>
        supabase
          .from('habit_checks')
          .select('id, user_id, date, score, total_active, habits, created_at, updated_at')
          .eq('user_id', userId)
          .order('date', { ascending: true }),
      )) ?? [];

    const localChecks = (await getChecks(userId)) as SyncHabitCheck[];
    const remoteChecks: SyncHabitCheck[] = checksData.map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      score: row.score,
      totalActive: row.total_active,
      habits: Array.isArray(row.habits) ? row.habits : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
    }));

    const checksByDate = new Map(localChecks.map((check) => [check.date, check]));
    for (const remoteCheck of remoteChecks) {
      const localCheck = checksByDate.get(remoteCheck.date);
      if (!localCheck) {
        checksByDate.set(remoteCheck.date, remoteCheck);
        continue;
      }

      if (remoteCheck.score > localCheck.score) {
        checksByDate.set(remoteCheck.date, remoteCheck);
      }
    }

    if (remoteChecks.length > 0) {
      const mergedChecks = Array.from(checksByDate.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      await saveChecks(userId, mergedChecks);
    }

    const configData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          label: string;
          emoji: string | null;
          active: boolean | null;
          updated_at: string | null;
        }>
      >('pullAll: fetch habit_configs', () =>
        supabase
          .from('habit_configs')
          .select('id, user_id, label, emoji, active, updated_at')
          .eq('user_id', userId),
      )) ?? [];

    const localConfigs = ((await getConfig(userId)) ?? []) as SyncHabitConfig[];
    const remoteConfigs: SyncHabitConfig[] = configData.map((row) => ({
      id: row.id,
      label: row.label,
      emoji: row.emoji ?? '',
      active: row.active ?? true,
      updatedAt: row.updated_at ?? undefined,
    }));
    const localConfigsById = new Map(localConfigs.map((config) => [config.id, config]));
    const mergedConfigs: SyncHabitConfig[] = remoteConfigs.map((remoteConfig) => {
      const localConfig = localConfigsById.get(remoteConfig.id);
      localConfigsById.delete(remoteConfig.id);
      if (!localConfig) {
        return remoteConfig;
      }

      return isRemoteUpdatedAtNewer(remoteConfig.updatedAt, localConfig) ? remoteConfig : localConfig;
    });
    mergedConfigs.push(...localConfigsById.values());

    if (remoteConfigs.length > 0) {
      await saveConfig(userId, mergedConfigs);
    }
  } catch (error) {
    throw reportAndBuildError(`pullAll failed for user ${userId}`, error);
  }
}
