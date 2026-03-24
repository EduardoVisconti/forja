import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as storage from '../services/cardioStorage';
import type { CardioLog } from '../types';
import type { CardioFilterValue } from '../components/CardioCategoryFilter';

export function useCardioLog() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CardioFilterValue>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await storage.getLogs(userId);
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLogs = useMemo(
    () =>
      activeFilter
        ? logs.filter((l) => l.trainingType === activeFilter || l.zone === activeFilter)
        : logs,
    [logs, activeFilter],
  );

  const createLog = useCallback(
    async (data: Omit<CardioLog, 'id' | 'userId' | 'createdAt'>) => {
      const log = await storage.createLog(userId, data);
      setLogs((prev) => [log, ...prev]);
      triggerSync();
    },
    [userId],
  );

  const updateLog = useCallback(
    async (id: string, data: Partial<Omit<CardioLog, 'id' | 'userId' | 'createdAt'>>) => {
      await storage.updateLog(userId, id, data);
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
      triggerSync();
    },
    [userId],
  );

  const deleteLog = useCallback(
    async (id: string) => {
      await storage.deleteLog(userId, id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      triggerSync();
    },
    [userId],
  );

  return {
    logs: filteredLogs,
    isLoading,
    error,
    activeFilter,
    setActiveFilter,
    createLog,
    updateLog,
    deleteLog,
    reload: load,
  };
}
