import { useCallback, useEffect, useRef } from 'react';
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
  const isBootstrapping = useRef(false);

  const bootstrapSync = useCallback(
    async (targetUserId: string) => {
      if (isBootstrapping.current) return;
      isBootstrapping.current = true;

      try {
        await pullAll(targetUserId);
      } catch {
        // Pull errors should not block the regular push attempt.
      } finally {
        const activeUserId = useAuthStore.getState().user?.id;
        if (activeUserId === targetUserId) {
          await triggerSync();
        }
        isBootstrapping.current = false;
      }
    },
    [triggerSync],
  );

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
        const activeUserId = useAuthStore.getState().user?.id;
        if (!activeUserId) return;
        void bootstrapSync(activeUserId);
      }
    });

    return () => subscription.remove();
  }, [bootstrapSync]);

  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;

    if (!userId) return;
    if (previous === userId) return;

    void bootstrapSync(userId);
  }, [bootstrapSync, userId]);

  return { syncStatus };
}
