import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from './syncStore';
import { useAuthStore } from '@/core/auth/authStore';
import { pullAll } from './syncService';

export function useSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const setIsOnline = useSyncStore((s) => s.setIsOnline);
  const triggerSync = useSyncStore((s) => s.triggerSync);
  const previousUserId = useRef<string | null>(userId);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, [setIsOnline]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        triggerSync();
      }
    });

    return () => subscription.remove();
  }, [triggerSync]);

  useEffect(() => {
    const wasLoggedOut = previousUserId.current === null;
    previousUserId.current = userId;

    if (!wasLoggedOut || !userId) return;

    let cancelled = false;

    const bootstrapSync = async () => {
      try {
        await pullAll(userId);
      } catch {
        // Pull errors should not block the regular push attempt.
      }

      if (!cancelled) {
        await triggerSync();
      }
    };

    bootstrapSync();

    return () => {
      cancelled = true;
    };
  }, [triggerSync, userId]);

  return { syncStatus };
}
