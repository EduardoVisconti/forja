import { getAllSessions, getSetLogs } from '@/features/workout/services/sessionStorage';
import type { SetLog, WorkoutSession } from '@/features/workout/types/session';
import { getLogs as getCardioLogs } from '@/features/cardio/services/cardioStorage';
import type { CardioLog } from '@/features/cardio/types';
import { getChecks, getConfig } from '@/features/habits/services/habitStorage';
import type { HabitCheck } from '@/features/habits/types';

import type {
  CalendarDayVM,
  CardioDayAgg,
  DaySummaryVM,
  HistoryDailyAgg,
  HistorySources,
  HabitDayAgg,
  PrExerciseVM,
  TemplateGroup,
  WeeklyHabitScoreVM,
  WeeklyVolumeBarItem,
  WeeklyVolumeVM,
  WorkoutDayAgg,
} from '../types/historyTypes';
import type { PrSessionWeightPoint } from '../types/historyTypes';

const TEMPLATE_GROUPS: TemplateGroup[] = ['pull', 'push', 'legs', 'custom'];

function toDateISO(isoOrDateISO: string): string {
  // Treat `YYYY-MM-DD` as already-local date and convert full ISO date-time
  // into local day ISO (`YYYY-MM-DD`) to match habit/cardio storage format.
  if (isoOrDateISO.includes('T')) {
    return toLocalDayISO(new Date(isoOrDateISO));
  }
  return isoOrDateISO;
}

function toLocalDayISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastNDaysISO(n: number, endDate: Date): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    result.push(toLocalDayISO(d));
  }
  return result;
}

function templateGroupFromName(templateName: string): TemplateGroup {
  const normalized = templateName.trim().toLowerCase();
  if (normalized === 'pull') return 'pull';
  if (normalized === 'push') return 'push';
  if (normalized === 'legs') return 'legs';
  return 'custom';
}

function getHabitLabelEmoji(
  habitId: string,
  configById: Map<string, { label: string; emoji: string }>,
): { label: string; emoji: string } {
  return configById.get(habitId) ?? { label: habitId, emoji: '❓' };
}

function sumSessionVolumeKg(setLogs: SetLog[]): number {
  return setLogs.reduce((acc, l) => acc + l.repsDone * l.weightKg, 0);
}

function ensureWorkoutAgg(daily: HistoryDailyAgg, dateISO: string): WorkoutDayAgg {
  if (daily.workout[dateISO]) return daily.workout[dateISO];
  const initial: WorkoutDayAgg = {
    sessionsCount: 0,
    totalVolumeKg: 0,
    templateNames: [],
    volumeByGroupKg: {
      pull: 0,
      push: 0,
      legs: 0,
      custom: 0,
    },
  };
  daily.workout[dateISO] = initial;
  return initial;
}

function ensureCardioAgg(daily: HistoryDailyAgg, dateISO: string): CardioDayAgg {
  if (daily.cardio[dateISO]) return daily.cardio[dateISO];
  const initial: CardioDayAgg = { logs: [], totalDurationMinutes: 0 };
  daily.cardio[dateISO] = initial;
  return initial;
}

function ensureHabitAgg(daily: HistoryDailyAgg, dateISO: string): HabitDayAgg {
  if (daily.habits[dateISO]) return daily.habits[dateISO];
  // placeholder; will be replaced once we set check.
  throw new Error(`Habit agg must be created from HabitCheck (${dateISO})`);
}

function formatColorForGroup(group: TemplateGroup): string {
  switch (group) {
    case 'pull':
      return '#22c55e';
    case 'push':
      return '#3b82f6';
    case 'legs':
      return '#8b5cf6';
    case 'custom':
      return '#9ca3af';
  }
}

interface ExerciseAgg {
  exerciseName: string;
  bestWeightKg: number;
  bestAtISO: string;
  sessionMaxWeights: Record<string, number>;
  // Track best date deterministically: if multiple sets share the best weight,
  // keep the earliest completion date.
  bestCompletedAtISO: string;
}

export async function getHistorySources(userId: string): Promise<HistorySources> {
  if (!userId) {
    return {
      daily: { workout: {}, cardio: {}, habits: {} },
      weeklyVolume: { items: [], maxValueKg: 0 },
      weeklyHabitScore: { points: [], maxHabits: 8 },
      prExercises: [],
    };
  }

  const daily: HistoryDailyAgg = { workout: {}, cardio: {}, habits: {} };

  // Needed to build PR progression by session.
  const sessions = await getAllSessions(userId);
  const sessionsById = new Map<string, WorkoutSession>(sessions.map((s) => [s.id, s]));

  // Build per-day workout aggregate + per-exercise PR progression.
  const exerciseAggById = new Map<string, ExerciseAgg>();

  for (const session of sessions) {
    const sessionDateISO = toDateISO(session.finishedAt);
    const logs = await getSetLogs(session.id);
    if (logs.length === 0) continue;

    const sessionVolumeKg = sumSessionVolumeKg(logs);
    const group = templateGroupFromName(session.templateName);

    const workoutAgg = ensureWorkoutAgg(daily, sessionDateISO);
    workoutAgg.sessionsCount += 1;
    workoutAgg.totalVolumeKg += sessionVolumeKg;
    workoutAgg.templateNames = Array.from(new Set([...workoutAgg.templateNames, session.templateName]));
    workoutAgg.volumeByGroupKg[group] += sessionVolumeKg;

    // Exercise aggregation for PR list & progression.
    for (const log of logs) {
      const exerciseId = log.exerciseId;
      const prev = exerciseAggById.get(exerciseId);
      const completedISO = toDateISO(log.completedAt);

      if (!prev) {
        exerciseAggById.set(exerciseId, {
          exerciseName: log.exerciseName,
          bestWeightKg: log.weightKg,
          bestAtISO: completedISO,
          bestCompletedAtISO: completedISO,
          sessionMaxWeights: { [session.id]: log.weightKg },
        });
        continue;
      }

      const sessionMax = prev.sessionMaxWeights[session.id] ?? 0;
      if (log.weightKg > sessionMax) {
        prev.sessionMaxWeights[session.id] = log.weightKg;
      }

      if (log.weightKg > prev.bestWeightKg) {
        prev.bestWeightKg = log.weightKg;
        prev.bestCompletedAtISO = completedISO;
        prev.bestAtISO = completedISO;
      } else if (log.weightKg === prev.bestWeightKg) {
        // If equal weight, keep earliest completion date.
        if (completedISO < prev.bestCompletedAtISO) {
          prev.bestCompletedAtISO = completedISO;
          prev.bestAtISO = completedISO;
        }
      }
    }
  }

  // Cardio aggregate.
  const cardioLogs = await getCardioLogs(userId);
  for (const log of cardioLogs) {
    const dateISO = log.date;
    const agg = ensureCardioAgg(daily, dateISO);
    agg.logs.push(log);
    agg.totalDurationMinutes += log.durationMinutes;
  }

  // Habit aggregate + label mapping.
  const habitChecks = await getChecks(userId);
  const habitConfigs = (await getConfig(userId)) ?? [];
  const configById = new Map<string, { label: string; emoji: string }>(
    habitConfigs.map((c) => [c.id, { label: c.label, emoji: c.emoji }]),
  );

  for (const check of habitChecks) {
    const checkedHabits = check.habits
      .filter((h) => h.checked)
      .map((h) => ({ habitId: h.habitId, ...getHabitLabelEmoji(h.habitId, configById) }));

    daily.habits[check.date] = {
      check,
      checkedHabits,
    };
  }

  const weeklyVolume = buildWeeklyVolume(daily);
  const weeklyHabitScore = buildWeeklyHabitScore(daily);
  const prExercises = buildPrExercises(exerciseAggById, sessionsById);

  return { daily, weeklyVolume, weeklyHabitScore, prExercises };
}

export function buildDaySummary(dateISO: string, daily: HistoryDailyAgg): DaySummaryVM {
  const workout = daily.workout[dateISO];
  const cardio = daily.cardio[dateISO];
  const habits = daily.habits[dateISO];

  return {
    dateISO,
    hasWorkout: Boolean(workout?.sessionsCount),
    hasCardio: Boolean(cardio?.logs?.length),
    hasHabits: Boolean(habits?.check && habits.check.score > 0),
    workout,
    cardio,
    habits,
  };
}

export function buildCalendarDayVM({
  dateISO,
  dayNumber,
  isInCurrentMonth,
  daily,
  yearMonthKey,
}: {
  dateISO: string;
  dayNumber: number;
  isInCurrentMonth: boolean;
  daily: HistoryDailyAgg;
  yearMonthKey: string;
}): CalendarDayVM {
  const workout = daily.workout[dateISO];
  const cardio = daily.cardio[dateISO];
  const habits = daily.habits[dateISO];

  return {
    dateISO,
    dayNumber,
    isInCurrentMonth,
    dots: {
      workout: Boolean(workout?.sessionsCount),
      cardio: Boolean(cardio?.logs?.length),
      habit: Boolean(habits?.check && habits.check.score > 0),
    },
  };
}

function buildWeeklyVolume(daily: HistoryDailyAgg): WeeklyVolumeVM {
  const today = new Date();
  const last7 = getLastNDaysISO(7, today);

  const totalsByGroup: Record<TemplateGroup, number> = {
    pull: 0,
    push: 0,
    legs: 0,
    custom: 0,
  };

  for (const dateISO of last7) {
    const workout = daily.workout[dateISO];
    if (!workout) continue;

    for (const group of TEMPLATE_GROUPS) {
      totalsByGroup[group] += workout.volumeByGroupKg[group] ?? 0;
    }
  }

  const items: WeeklyVolumeBarItem[] = TEMPLATE_GROUPS.map((group) => ({
    group,
    labelKey: group,
    valueKg: totalsByGroup[group],
    color: formatColorForGroup(group),
  }));

  const maxValueKg = Math.max(...items.map((i) => i.valueKg), 0);
  return { items, maxValueKg };
}

function buildWeeklyHabitScore(daily: HistoryDailyAgg): WeeklyHabitScoreVM {
  const today = new Date();
  const last7 = getLastNDaysISO(7, today);

  const points = last7.map((dateISO) => ({
    dateISO,
    value: daily.habits[dateISO]?.check.score ?? 0,
  }));

  const maxHabits = Math.max(
    ...last7.map((dateISO) => daily.habits[dateISO]?.check.totalActive ?? 0),
    8,
  );

  return { points, maxHabits };
}

function buildPrExercises(
  exerciseAggById: Map<string, ExerciseAgg>,
  sessionsById: Map<string, WorkoutSession>,
): PrExerciseVM[] {
  const results: PrExerciseVM[] = [];

  for (const [exerciseId, agg] of exerciseAggById.entries()) {
    const sessionIds = Object.keys(agg.sessionMaxWeights);
    if (sessionIds.length < 2) continue;

    const progression: PrSessionWeightPoint[] = sessionIds
      .map((sessionId) => {
        const session = sessionsById.get(sessionId);
        if (!session) return null;
        return {
          sessionId,
          dateISO: toDateISO(session.finishedAt),
          finishedAt: session.finishedAt,
          weightKg: agg.sessionMaxWeights[sessionId],
        };
      })
      .filter((p): p is PrSessionWeightPoint => Boolean(p))
      .sort((a, b) => (a.finishedAt > b.finishedAt ? 1 : -1));

    results.push({
      exerciseId,
      exerciseName: agg.exerciseName,
      bestWeightKg: agg.bestWeightKg,
      bestAtISO: agg.bestAtISO,
      sessionCount: sessionIds.length,
      progression,
    });
  }

  // Sort by best weight desc, then by date desc.
  results.sort((a, b) => {
    if (b.bestWeightKg !== a.bestWeightKg) return b.bestWeightKg - a.bestWeightKg;
    return b.bestAtISO.localeCompare(a.bestAtISO);
  });

  return results;
}

