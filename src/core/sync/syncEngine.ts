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
  getPlans,
  getRecords as getCardioRecords,
  getStoredUserName,
  getSetLogs,
  getTemplates,
  saveAllSessions,
  saveChecks,
  saveConfig,
  saveExercises,
  savePlans,
  saveRecords as saveCardioRecords,
  saveSetLogs,
  saveTemplates,
  setOnboardingComplete,
  setStoredUserName,
} from '@/core/storage';
import { getDeletedRecords, wasDeleted } from '@/features/sync/services/deletedRecordsStorage';
import { reportSyncStatus } from './syncStatusReporter';

type TemplateType = 'gym' | 'cardio' | 'functional';
// Legacy — replaced by cardioPlanStorage records
type HabitCheckItem = Array<{ habitId: string; checked: boolean }>;

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

type SyncCardioPlan = {
  id: string;
  userId: string;
  activityType: 'running' | 'cycling' | 'swimming';
  title: string;
  trainingType: string | null;
  plannedDate: string;
  targetDistance: number | null;
  targetDuration: string | null;
  targetZone: string | null;
  targetPace: string | null;
  notes: string | null;
  status: 'pending' | 'completed' | 'skipped';
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedRecordId: string | null;
};

type SyncCardioRecord = {
  id: string;
  userId: string;
  planId: string | null;
  activityType: 'running' | 'cycling' | 'swimming';
  trainingType: string | null;
  performedAt: string;
  duration: string | null;
  distanceKm: number | null;
  avgPace: string | null;
  avgHr: number | null;
  zone: string | null;
  notes: string | null;
  perceivedEffort: number | null;
  createdAt: string;
  updatedAt: string;
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

    const cardioPlans = (await getPlans(userId)) as SyncCardioPlan[];
    if (cardioPlans.length > 0) {
      const rows = cardioPlans.map((plan) => ({
        id: plan.id,
        user_id: plan.userId,
        activity_type: plan.activityType,
        title: plan.title,
        training_type: plan.trainingType,
        planned_date: plan.plannedDate,
        target_distance: plan.targetDistance,
        target_duration: plan.targetDuration,
        target_zone: plan.targetZone,
        target_pace: plan.targetPace,
        notes: plan.notes,
        status: plan.status,
        created_at: plan.createdAt,
        updated_at: plan.updatedAt ?? now,
        completed_at: plan.completedAt,
        completed_record_id: plan.completedRecordId,
      }));
      await runSupabaseCall('syncAll: upsert cardio_plans', () =>
        supabase.from('cardio_plans').upsert(rows, { onConflict: 'id' }),
      );
    }
    if (cardioPlans.length === 0) {
      await runSupabaseCall('syncAll: delete cardio_plans for empty local set', () =>
        supabase.from('cardio_plans').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale cardio_plans', () =>
        supabase
          .from('cardio_plans')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(cardioPlans.map((plan) => plan.id))),
      );
    }

    const cardioRecords = (await getCardioRecords(userId)) as SyncCardioRecord[];
    if (cardioRecords.length > 0) {
      const rows = cardioRecords.map((record) => ({
        id: record.id,
        user_id: record.userId,
        plan_id: record.planId,
        activity_type: record.activityType,
        training_type: record.trainingType,
        performed_at: record.performedAt,
        duration: record.duration,
        distance_km: record.distanceKm,
        avg_pace: record.avgPace,
        avg_hr: record.avgHr,
        zone: record.zone,
        notes: record.notes,
        perceived_effort: record.perceivedEffort,
        created_at: record.createdAt,
        updated_at: record.updatedAt ?? now,
      }));
      await runSupabaseCall('syncAll: upsert cardio_records', () =>
        supabase.from('cardio_records').upsert(rows, { onConflict: 'id' }),
      );
    }
    if (cardioRecords.length === 0) {
      await runSupabaseCall('syncAll: delete cardio_records for empty local set', () =>
        supabase.from('cardio_records').delete().eq('user_id', userId),
      );
    } else {
      await runSupabaseCall('syncAll: delete stale cardio_records', () =>
        supabase
          .from('cardio_records')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', inFilter(cardioRecords.map((record) => record.id))),
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

    const deletedRecords = await getDeletedRecords(userId);
    const uniqueDeleted = Array.from(new Map(deletedRecords.map((record) => [record.id, record])).values());
    if (uniqueDeleted.length > 0) {
      const rows = uniqueDeleted.map((record) => ({
        id: record.id,
        table_name: record.tableName,
        user_id: userId,
        deleted_at: record.deletedAt,
      }));
      await runSupabaseCall('syncAll: upsert deleted_records', () =>
        supabase.from('deleted_records').upsert(rows, { onConflict: 'id' }),
      );
    }

    const localName = await getStoredUserName(userId);
    if (localName) {
      await runSupabaseCall('syncAll: upsert user_profiles', () =>
        supabase.from('user_profiles').upsert(
          {
            id: userId,
            display_name: localName,
            onboarding_complete: true,
            updated_at: now,
          },
          { onConflict: 'id' },
        ),
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
    }

    if (profile?.display_name) {
      await setStoredUserName(userId, profile.display_name);
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

    const mergedTemplatesById = new Map(localTemplates.map((template) => [template.id, template]));
    for (const remoteTemplate of remoteTemplates) {
      const localTemplate = mergedTemplatesById.get(remoteTemplate.id);
      if (localTemplate) {
        mergedTemplatesById.set(
          remoteTemplate.id,
          isRemoteUpdatedAtNewer(remoteTemplate.updatedAt, localTemplate)
            ? remoteTemplate
            : localTemplate,
        );
        continue;
      }

      const deleted = await wasDeleted(userId, remoteTemplate.id);
      if (!deleted) {
        mergedTemplatesById.set(remoteTemplate.id, remoteTemplate);
      }
    }
    const mergedTemplates = Array.from(mergedTemplatesById.values());

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
      const mergedExercisesById = new Map(localExercises.map((exercise) => [exercise.id, exercise]));

      for (const exercise of remoteExercises) {
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

        const localExercise = mergedExercisesById.get(exercise.id);
        if (localExercise) {
          mergedExercisesById.set(
            exercise.id,
            isRemoteUpdatedAtNewer(exercise.updated_at, localExercise)
              ? remoteExercise
              : localExercise,
          );
          continue;
        }

        const deleted = await wasDeleted(userId, exercise.id);
        if (!deleted) {
          mergedExercisesById.set(exercise.id, remoteExercise);
        }
      }
      const mergedExercises = Array.from(mergedExercisesById.values());

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
    const missingSessions = [];
    for (const session of remoteSessions) {
      if (localSessionIds.has(session.id)) continue;
      const deleted = await wasDeleted(userId, session.id);
      if (!deleted) {
        missingSessions.push(session);
      }
    }
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
        const isDeleted = await wasDeleted(userId, sessionId);
        if (isDeleted) continue;

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

    const cardioPlansData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          activity_type: 'running' | 'cycling' | 'swimming';
          title: string;
          training_type: string | null;
          planned_date: string;
          target_distance: number | null;
          target_duration: string | null;
          target_zone: string | null;
          target_pace: string | null;
          notes: string | null;
          status: 'pending' | 'completed' | 'skipped';
          created_at: string;
          updated_at: string | null;
          completed_at: string | null;
          completed_record_id: string | null;
        }>
      >('pullAll: fetch cardio_plans', () =>
        supabase
          .from('cardio_plans')
          .select(
            'id, user_id, activity_type, title, training_type, planned_date, target_distance, target_duration, target_zone, target_pace, notes, status, created_at, updated_at, completed_at, completed_record_id',
          )
          .eq('user_id', userId)
          .order('planned_date', { ascending: true }),
      )) ?? [];

    const localCardioPlans = (await getPlans(userId)) as SyncCardioPlan[];
    const remoteCardioPlans: SyncCardioPlan[] = cardioPlansData.map((row) => ({
      id: row.id,
      userId: row.user_id,
      activityType: row.activity_type,
      title: row.title,
      trainingType: row.training_type,
      plannedDate: row.planned_date,
      targetDistance: row.target_distance,
      targetDuration: row.target_duration,
      targetZone: row.target_zone,
      targetPace: row.target_pace,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      completedAt: row.completed_at,
      completedRecordId: row.completed_record_id,
    }));
    const mergedCardioPlansById = new Map(localCardioPlans.map((plan) => [plan.id, plan]));
    for (const remotePlan of remoteCardioPlans) {
      const localPlan = mergedCardioPlansById.get(remotePlan.id);
      if (localPlan) {
        mergedCardioPlansById.set(
          remotePlan.id,
          isRemoteUpdatedAtNewer(remotePlan.updatedAt, localPlan) ? remotePlan : localPlan,
        );
        continue;
      }

      const deleted = await wasDeleted(userId, remotePlan.id);
      if (!deleted) {
        mergedCardioPlansById.set(remotePlan.id, remotePlan);
      }
    }
    const mergedCardioPlans = Array.from(mergedCardioPlansById.values());
    if (remoteCardioPlans.length > 0) {
      await savePlans(
        userId,
        mergedCardioPlans.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)),
      );
    }

    const cardioRecordsData =
      (await runSupabaseCall<
        Array<{
          id: string;
          user_id: string;
          plan_id: string | null;
          activity_type: 'running' | 'cycling' | 'swimming';
          training_type: string | null;
          performed_at: string;
          duration: string | null;
          distance_km: number | null;
          avg_pace: string | null;
          avg_hr: number | null;
          zone: string | null;
          notes: string | null;
          perceived_effort: number | null;
          created_at: string;
          updated_at: string | null;
        }>
      >('pullAll: fetch cardio_records', () =>
        supabase
          .from('cardio_records')
          .select(
            'id, user_id, plan_id, activity_type, training_type, performed_at, duration, distance_km, avg_pace, avg_hr, zone, notes, perceived_effort, created_at, updated_at',
          )
          .eq('user_id', userId)
          .order('performed_at', { ascending: false }),
      )) ?? [];

    const localCardioRecords = (await getCardioRecords(userId)) as SyncCardioRecord[];
    const remoteCardioRecords: SyncCardioRecord[] = cardioRecordsData.map((row) => ({
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      activityType: row.activity_type,
      trainingType: row.training_type,
      performedAt: row.performed_at,
      duration: row.duration,
      distanceKm: row.distance_km,
      avgPace: row.avg_pace,
      avgHr: row.avg_hr,
      zone: row.zone,
      notes: row.notes,
      perceivedEffort: row.perceived_effort,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
    }));
    const mergedCardioRecordsById = new Map(localCardioRecords.map((record) => [record.id, record]));
    for (const remoteRecord of remoteCardioRecords) {
      const localRecord = mergedCardioRecordsById.get(remoteRecord.id);
      if (localRecord) {
        mergedCardioRecordsById.set(
          remoteRecord.id,
          isRemoteUpdatedAtNewer(remoteRecord.updatedAt, localRecord) ? remoteRecord : localRecord,
        );
        continue;
      }

      const deleted = await wasDeleted(userId, remoteRecord.id);
      if (!deleted) {
        mergedCardioRecordsById.set(remoteRecord.id, remoteRecord);
      }
    }
    const mergedCardioRecords = Array.from(mergedCardioRecordsById.values());
    if (remoteCardioRecords.length > 0) {
      await saveCardioRecords(
        userId,
        mergedCardioRecords.sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
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
