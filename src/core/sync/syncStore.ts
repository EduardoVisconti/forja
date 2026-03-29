import { create } from 'zustand';
import { useAuthStore } from '@/core/auth/authStore';
import type { SyncStatus } from './types';
import { syncAll } from './syncService';

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

    console.log('[Sync] triggerSync starting for userId:', userId);
    set({ syncStatus: 'syncing' });
    try {
      await syncAll(userId);
      console.log('[Sync] triggerSync completed successfully');
      set({ syncStatus: 'synced' });
    } catch {
      set({ syncStatus: 'error' });
    }
  },
}));

export const triggerSync = () => {
  useSyncStore.getState().triggerSync();
};
