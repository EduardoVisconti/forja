import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/core/auth/authStore';
import { supabase } from '@/core/supabase/client';
import { hasCompletedOnboarding, setOnboardingComplete } from '../services/onboardingStorage';

const userNameKey = (userId: string) => `user:name:${userId}`;

interface UseOnboardingResult {
  isLoading: boolean;
  hasCompleted: boolean;
  submitName: (name: string) => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingStatus() {
      if (!userId) {
        if (!isMounted) return;
        setHasCompleted(false);
        setIsLoading(false);
        return;
      }

      try {
        const completed = await hasCompletedOnboarding(userId);
        if (!isMounted) return;
        setHasCompleted(completed);
      } catch {
        if (!isMounted) return;
        setHasCompleted(false);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const submitName = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      await AsyncStorage.setItem(userNameKey(userId), trimmedName);

      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (error) {
        throw error;
      }

      await setOnboardingComplete(userId);
      setHasCompleted(true);
    },
    [userId],
  );

  return { isLoading, hasCompleted, submitName };
}
