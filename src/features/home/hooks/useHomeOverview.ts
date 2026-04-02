import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/core/auth/authStore';
import { getPlans, getRecords } from '@/features/cardio/services/cardioPlanStorage';
import type { CardioLog, CardioType, CardioZone } from '@/features/cardio/types';
import type { CardioRecord } from '@/features/cardio/types/plans';
import { getConfig, getTodayCheck } from '@/features/habits/services/habitStorage';
import { HABIT_KEYS, type HabitCheck, type HabitConfig } from '@/features/habits/types';
import { getAllSessions } from '@/features/workout/services/sessionStorage';
import { useWorkoutSessionStore } from '@/features/workout/store/workoutSessionStore';
import { getHistorySources } from '@/features/history/services/historyService';
import type { WorkoutSession } from '@/features/workout/types/session';
import type { HistorySources } from '@/features/history/types/historyTypes';
import type { WeeklyStreakVM } from '@/features/history/types/historyTypes';

type HomeInsightType = 'streak' | 'habits' | 'noActivity' | 'motivational';

interface TodayWorkout {
  templateName: string;
  durationMinutes: number;
}

interface TodayCardio {
  trainingType: CardioType;
  zone: CardioZone;
  distanceKm: number;
}

interface ActiveSessionOverview {
  sessionId: string;
  templateId: string;
  templateName: string;
  completedExercises: number;
  totalExercises: number;
}

interface TodayCardioPlan {
  planId: string;
  title: string;
  trainingType: string | null;
  targetDistance: number | null;
  targetDuration: string | null;
}

interface MonthlyStats {
  workoutCount: number;
  totalKm: number;
  habitPercentage: number;
}

interface TodayActivityState {
  hasWorkout: boolean;
  hasCardio: boolean;
  hasAny: boolean;
  count: number;
}

interface TodayHabitsSummary {
  score: number;
  totalActive: number;
  remaining: number;
  progress: number;
  isComplete: boolean;
}

interface InsightMeta {
  streakCount: number;
  remainingHabits: number;
}

interface HomeOverviewState {
  isLoading: boolean;
  error: string | null;
  displayName: string;
  todayHabits: HabitCheck | null;
  todayWorkout: TodayWorkout | null;
  activeSession: ActiveSessionOverview | null;
  todayCardio: TodayCardio | null;
  todayCardioPlan: TodayCardioPlan | null;
  todayActivity: TodayActivityState;
  todayHabitsSummary: TodayHabitsSummary;
  weeklyStreak: WeeklyStreakVM | null;
  monthlyStats: MonthlyStats;
  insightType: HomeInsightType;
  insightMeta: InsightMeta;
}

const initialState: HomeOverviewState = {
  isLoading: true,
  error: null,
  displayName: '',
  todayHabits: null,
  todayWorkout: null,
  activeSession: null,
  todayCardio: null,
  todayCardioPlan: null,
  todayActivity: { hasWorkout: false, hasCardio: false, hasAny: false, count: 0 },
  todayHabitsSummary: { score: 0, totalActive: HABIT_KEYS.length, remaining: HABIT_KEYS.length, progress: 0, isComplete: false },
  weeklyStreak: null,
  monthlyStats: { workoutCount: 0, totalKm: 0, habitPercentage: 0 },
  insightType: 'motivational',
  insightMeta: { streakCount: 0, remainingHabits: HABIT_KEYS.length },
};

const userNameKey = (userId: string) => `user:name:${userId}`;

function resolveDisplayName(storedName: string | null, metadataName?: string, email?: string | null): string {
  if (storedName && storedName.trim().length > 0) return storedName.trim();
  if (metadataName && metadataName.trim().length > 0) return metadataName.trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return '';
}

function toLocalDayISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pickTodayWorkout(sessions: WorkoutSession[], todayISO: string): TodayWorkout | null {
  const todaySessions = sessions
    .filter((session) => toLocalDayISO(new Date(session.finishedAt)) === todayISO)
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());

  const latest = todaySessions[0];
  if (!latest) return null;

  return {
    templateName: latest.templateName,
    durationMinutes: latest.durationMinutes,
  };
}

function pickTodayCardio(cardioLogs: CardioLog[], todayISO: string): TodayCardio | null {
  const todayLogs = cardioLogs
    .filter((log) => log.date === todayISO)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const latest = todayLogs[0];
  if (!latest) return null;

  return {
    trainingType: latest.trainingType,
    zone: latest.zone,
    distanceKm: latest.distanceKm,
  };
}

function mapRecordToCardioLog(record: CardioRecord): CardioLog {
  return {
    id: record.id,
    userId: record.userId,
    date: record.performedAt,
    trainingType: (record.trainingType as CardioType) ?? null,
    zone: (record.zone as CardioZone) ?? null,
    duration: record.duration ?? '',
    distanceKm: record.distanceKm ?? 0,
    avgPace: record.avgPace ?? '',
    avgHr: record.avgHr,
    notes: record.notes ?? '',
    createdAt: record.createdAt,
  };
}

function monthPrefix(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isDateInCurrentMonth(dateISO: string, prefix: string): boolean {
  return dateISO.startsWith(prefix);
}

function resolveTotalActiveHabits(todayHabits: HabitCheck | null, habitConfig: HabitConfig[] | null): number {
  const activeFromConfig = habitConfig?.filter((habit) => habit.active).length ?? 0;
  if (activeFromConfig > 0) return activeFromConfig;
  const totalFromToday = todayHabits?.totalActive ?? 0;
  if (totalFromToday > 0) return totalFromToday;
  return HABIT_KEYS.length;
}

function buildMonthlyStats({
  sessions,
  cardioLogs,
  historySources,
  totalActiveHabits,
  now,
}: {
  sessions: WorkoutSession[];
  cardioLogs: CardioLog[];
  historySources: HistorySources;
  totalActiveHabits: number;
  now: Date;
}): MonthlyStats {
  const prefix = monthPrefix(now);

  const workoutCount = sessions.filter((session) =>
    isDateInCurrentMonth(toLocalDayISO(new Date(session.finishedAt)), prefix),
  ).length;

  const totalKm = cardioLogs
    .filter((log) => isDateInCurrentMonth(log.date, prefix))
    .reduce((sum, log) => sum + log.distanceKm, 0);

  const habitScoreSum = Object.entries(historySources.daily.habits).reduce((sum, [dateISO, habitDay]) => {
    if (!isDateInCurrentMonth(dateISO, prefix)) return sum;
    return sum + habitDay.check.score;
  }, 0);

  const daysWithEntries = Object.keys(historySources.daily.habits).filter((dateISO) =>
    isDateInCurrentMonth(dateISO, prefix),
  ).length;
  const denominator = totalActiveHabits * daysWithEntries;
  const rawPercentage = denominator > 0 ? (habitScoreSum / denominator) * 100 : 0;
  const habitPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage)));

  return {
    workoutCount,
    totalKm,
    habitPercentage,
  };
}

function resolveInsightType({
  streakCount,
  todayHabitsSummary,
  todayActivity,
  now,
}: {
  streakCount: number;
  todayHabitsSummary: TodayHabitsSummary;
  todayActivity: TodayActivityState;
  now: Date;
}): HomeInsightType {
  if (streakCount >= 2) return 'streak';

  if (todayHabitsSummary.score > 0 && !todayHabitsSummary.isComplete) {
    return 'habits';
  }

  if (!todayActivity.hasAny && now.getHours() >= 14) {
    return 'noActivity';
  }

  return 'motivational';
}

function buildTodayActivity(
  todayWorkout: TodayWorkout | null,
  todayCardio: TodayCardio | null,
  activeSession: ActiveSessionOverview | null,
): TodayActivityState {
  const hasWorkout = Boolean(todayWorkout || activeSession);
  const hasCardio = Boolean(todayCardio);
  return {
    hasWorkout,
    hasCardio,
    hasAny: hasWorkout || hasCardio,
    count: Number(hasWorkout) + Number(hasCardio),
  };
}

function buildTodayHabitsSummary(todayHabits: HabitCheck | null, defaultTotalActive: number): TodayHabitsSummary {
  const score = todayHabits?.score ?? 0;
  const totalActive = todayHabits?.totalActive ?? defaultTotalActive;
  const remaining = Math.max(0, totalActive - score);
  const progress = totalActive > 0 ? score / totalActive : 0;
  const isComplete = totalActive > 0 && score === totalActive;

  return {
    score,
    totalActive,
    remaining,
    progress,
    isComplete,
  };
}

export function useHomeOverview() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const [state, setState] = useState<HomeOverviewState>(initialState);
  const [refreshToken, setRefreshToken] = useState(0);

  const reloadOverview = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (!userId) {
        if (!isMounted) return;
        setState({ ...initialState, isLoading: false });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const [sessions, cardioRecords, todayHabits, habitConfig, historySources, storedName, plans] = await Promise.all([
          getAllSessions(userId),
          getRecords(userId),
          getTodayCheck(userId),
          getConfig(userId),
          getHistorySources(userId),
          AsyncStorage.getItem(userNameKey(userId)),
          getPlans(userId),
        ]);
        const cardioLogs = cardioRecords.map(mapRecordToCardioLog);
        const now = new Date();
        const todayISO = toLocalDayISO(now);
        const storeState = useWorkoutSessionStore.getState();
        const activeSession = storeState.sessionId
          ? {
              sessionId: storeState.sessionId,
              templateId: storeState.templateId ?? '',
              templateName: storeState.templateName,
              completedExercises: Object.keys(storeState.completedExercises).length,
              totalExercises: storeState.exercises.length,
            }
          : null;
        const todayWorkout = pickTodayWorkout(sessions, todayISO);
        const todayCardio = pickTodayCardio(cardioLogs, todayISO);
        const todayPlan = plans.find((plan) => plan.plannedDate === todayISO && plan.status === 'pending') ?? null;
        const todayCardioPlan = todayPlan
          ? {
              planId: todayPlan.id,
              title: todayPlan.title,
              trainingType: todayPlan.trainingType,
              targetDistance: todayPlan.targetDistance,
              targetDuration: todayPlan.targetDuration,
            }
          : null;
        const totalActiveHabits = resolveTotalActiveHabits(todayHabits, habitConfig);
        const todayActivity = buildTodayActivity(todayWorkout, todayCardio, activeSession);
        const todayHabitsSummary = buildTodayHabitsSummary(todayHabits, totalActiveHabits);
        const monthlyStats = buildMonthlyStats({
          sessions,
          cardioLogs,
          historySources,
          totalActiveHabits,
          now,
        });
        const insightType = resolveInsightType({
          streakCount: historySources.weeklyStreak.streakCount,
          todayHabitsSummary,
          todayActivity,
          now,
        });

        if (!isMounted) return;
        setState({
          isLoading: false,
          error: null,
          displayName: resolveDisplayName(
            storedName,
            user?.user_metadata?.full_name as string | undefined,
            user?.email,
          ),
          todayHabits,
          todayWorkout,
          activeSession,
          todayCardio,
          todayCardioPlan,
          todayActivity,
          todayHabitsSummary,
          weeklyStreak: historySources.weeklyStreak,
          monthlyStats,
          insightType,
          insightMeta: {
            streakCount: historySources.weeklyStreak.streakCount,
            remainingHabits: todayHabitsSummary.remaining,
          },
        });
      } catch (error) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [refreshToken, userId, user?.email, user?.user_metadata?.full_name]);

  return {
    user,
    userId,
    reloadOverview,
    ...state,
  };
}
