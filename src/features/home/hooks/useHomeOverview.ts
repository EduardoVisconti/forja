import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { getAllSessions } from '@/features/workout/services/sessionStorage';
import { getTodayCheck } from '@/features/habits/services/habitStorage';
import { getHistorySources } from '@/features/history/services/historyService';
import type { WorkoutSession } from '@/features/workout/types/session';
import type { HabitCheck } from '@/features/habits/types';
import type { WeeklyStreakVM } from '@/features/history/types/historyTypes';

interface HomeOverviewState {
  isLoading: boolean;
  error: string | null;
  lastWorkout: WorkoutSession | null;
  todayHabits: HabitCheck | null;
  weeklyStreak: WeeklyStreakVM | null;
}

const initialState: HomeOverviewState = {
  isLoading: true,
  error: null,
  lastWorkout: null,
  todayHabits: null,
  weeklyStreak: null,
};

export function useHomeOverview() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const [state, setState] = useState<HomeOverviewState>(initialState);

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
        const [sessions, todayHabits, historySources] = await Promise.all([
          getAllSessions(userId),
          getTodayCheck(userId),
          getHistorySources(userId),
        ]);

        const lastWorkout =
          sessions
            .slice()
            .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())[0] ??
          null;

        if (!isMounted) return;
        setState({
          isLoading: false,
          error: null,
          lastWorkout,
          todayHabits,
          weeklyStreak: historySources.weeklyStreak,
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
  }, [userId]);

  return {
    user,
    userId,
    ...state,
  };
}
