import { create } from 'zustand';
import { useAuthStore } from '@/core/auth/authStore';
import type { SyncStatus } from './types';
import { syncAll } from './syncService';
import { registerSyncStatusReporter } from './syncStatusReporter';

interface SyncStore {
  syncStatus: SyncStatus;
  isOnline: boolean;
  setSyncStatus: (status: SyncStatus) => void;
  setIsOnline: (online: boolean) => void;
  triggerSync: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncStatus: 'synced',
  isOnline: true,

  setSyncStatus: (syncStatus) => set({ syncStatus }),

  setIsOnline: (online) => {
    const prev = get().isOnline;
    set({ isOnline: online });
    if (!online) {
      set({ syncStatus: 'offline' });
    } else if (prev === false) {
      get().triggerSync();
    }
  },

  triggerSync: async () => {
    const state = get();
    if (!state.isOnline) {
      set({ syncStatus: 'offline' });
      return;
    }

    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ syncStatus: 'syncing' });
    try {
      await syncAll(userId);
      set({ syncStatus: 'synced' });
    } catch {
      set({ syncStatus: 'error' });
    }
  },
}));

registerSyncStatusReporter((status) => {
  useSyncStore.getState().setSyncStatus(status);
});

export const triggerSync = () => {
  useSyncStore.getState().triggerSync();
};
