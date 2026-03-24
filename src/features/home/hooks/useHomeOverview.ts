import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  displayName: string;
  lastWorkout: WorkoutSession | null;
  todayHabits: HabitCheck | null;
  weeklyStreak: WeeklyStreakVM | null;
}

const initialState: HomeOverviewState = {
  isLoading: true,
  error: null,
  displayName: '',
  lastWorkout: null,
  todayHabits: null,
  weeklyStreak: null,
};

const userNameKey = (userId: string) => `user:name:${userId}`;

function resolveDisplayName(storedName: string | null, metadataName?: string, email?: string | null): string {
  if (storedName && storedName.trim().length > 0) return storedName.trim();
  if (metadataName && metadataName.trim().length > 0) return metadataName.trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return '';
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
