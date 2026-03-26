import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/core/auth/authStore';
import { getAllSessions } from '@/features/workout/services/sessionStorage';
import { getTodayCheck } from '@/features/habits/services/habitStorage';
import { getHistorySources } from '@/features/history/services/historyService';
import type { WorkoutSession } from '@/features/workout/types/session';
import type { HabitCheck } from '@/features/habits/types';
import type { HistorySources } from '@/features/history/types/historyTypes';
import type { WeeklyStreakVM } from '@/features/history/types/historyTypes';

interface HomeOverviewState {
  isLoading: boolean;
  error: string | null;
  displayName: string;
  lastWorkout: WorkoutSession | null;
  todayHabits: HabitCheck | null;
  weeklyStreak: WeeklyStreakVM | null;
  weeklyWorkoutCount: number;
  weeklyKm: number;
  weeklyHabitAvg: {
    score: number;
    total: number;
  };
}

const initialState: HomeOverviewState = {
  isLoading: true,
  error: null,
  displayName: '',
  lastWorkout: null,
  todayHabits: null,
  weeklyStreak: null,
  weeklyWorkoutCount: 0,
  weeklyKm: 0,
  weeklyHabitAvg: { score: 0, total: 8 },
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

function buildWeeklyMetrics(historySources: HistorySources): {
  weeklyWorkoutCount: number;
  weeklyKm: number;
  weeklyHabitAvg: { score: number; total: number };
} {
  const todayISO = toLocalDayISO(new Date());
  const weekDateISOs = historySources.weeklyStreak.weekDays.map((day) => day.dateISO);
  const weekDateISOsUntilToday = weekDateISOs.filter((dateISO) => dateISO <= todayISO);
  const habitDays = weekDateISOsUntilToday.length > 0 ? weekDateISOsUntilToday : weekDateISOs;

  const weeklyWorkoutCount = weekDateISOs.reduce((count, dateISO) => {
    return count + (historySources.daily.workout[dateISO]?.sessionsCount ?? 0);
  }, 0);

  const weeklyKm = weekDateISOs.reduce((distance, dateISO) => {
    const dayDistance =
      historySources.daily.cardio[dateISO]?.logs.reduce((sum, log) => sum + log.distanceKm, 0) ?? 0;
    return distance + dayDistance;
  }, 0);

  const weeklyHabitTotal = 8;
  const weeklyHabitScoreSum = habitDays.reduce((score, dateISO) => {
    return score + (historySources.daily.habits[dateISO]?.check.score ?? 0);
  }, 0);
  const weeklyHabitScoreAvg = habitDays.length > 0 ? weeklyHabitScoreSum / habitDays.length : 0;

  return {
    weeklyWorkoutCount,
    weeklyKm,
    weeklyHabitAvg: {
      score: weeklyHabitScoreAvg,
      total: weeklyHabitTotal,
    },
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
        const [sessions, todayHabits, historySources, storedName] = await Promise.all([
          getAllSessions(userId),
          getTodayCheck(userId),
          getHistorySources(userId),
          AsyncStorage.getItem(userNameKey(userId)),
        ]);
        const weeklyMetrics = buildWeeklyMetrics(historySources);

        const lastWorkout =
          sessions
            .slice()
            .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())[0] ??
          null;

        if (!isMounted) return;
        setState({
          isLoading: false,
          error: null,
          displayName: resolveDisplayName(
            storedName,
            user?.user_metadata?.full_name as string | undefined,
            user?.email,
          ),
          lastWorkout,
          todayHabits,
          weeklyStreak: historySources.weeklyStreak,
          weeklyWorkoutCount: weeklyMetrics.weeklyWorkoutCount,
          weeklyKm: weeklyMetrics.weeklyKm,
          weeklyHabitAvg: weeklyMetrics.weeklyHabitAvg,
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
