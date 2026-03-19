import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import * as storage from '../services/workoutStorage';
import type { UserPreferences } from '../types';

export function useUserPreferences() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [unit, setUnitState] = useState<UserPreferences['unit']>('kg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    storage.getUserPreferences(userId).then((prefs) => {
      setUnitState(prefs.unit);
      setIsLoading(false);
    });
  }, [userId]);

  const setUnit = useCallback(
    async (newUnit: UserPreferences['unit']) => {
      setUnitState(newUnit);
      await storage.saveUserPreferences(userId, { unit: newUnit });
    },
    [userId],
  );

  return { unit, setUnit, isLoading };
}
