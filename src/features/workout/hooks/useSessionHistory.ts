import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as sessionStorage from '../services/sessionStorage';
import type { WorkoutSession } from '../types/session';

export function useSessionHistory() {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const allSessions = await sessionStorage.getAllSessions(userId);
      const sorted = [...allSessions].sort(
        (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
      );
      setSessions(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      await sessionStorage.deleteSession(userId, sessionId);
      triggerSync();
      await load();
    },
    [load, userId],
  );

  const addManualSession = useCallback(
    async (templateId: string, templateName: string, date: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const session = await sessionStorage.createManualSession(userId, templateId, templateName, date);
      triggerSync();
      await load();
      return session;
    },
    [load, userId],
  );

  return {
    sessions,
    isLoading,
    error,
    deleteSession: removeSession,
    createManualSession: addManualSession,
    reload: load,
  };
}

