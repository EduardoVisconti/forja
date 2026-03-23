import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from './syncStore';

export function useSync() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const setIsOnline = useSyncStore((s) => s.setIsOnline);
  const triggerSync = useSyncStore((s) => s.triggerSync);

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

  return { syncStatus };
}
