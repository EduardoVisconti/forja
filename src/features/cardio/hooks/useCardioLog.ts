import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import * as storage from '../services/cardioStorage';
import type { CardioCategory, CardioLog } from '../types';

export function useCardioLog() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CardioCategory | null>(null);

  useEffect(() => {
    if (!userId) return;
    storage.getLogs(userId).then((data) => {
      setLogs(data);
      setIsLoading(false);
    });
  }, [userId]);

  const filteredLogs = useMemo(
    () => (activeCategory ? logs.filter((l) => l.category === activeCategory) : logs),
    [logs, activeCategory],
  );

  const createLog = useCallback(
    async (data: Omit<CardioLog, 'id' | 'userId' | 'createdAt'>) => {
      const log = await storage.createLog(userId, data);
      setLogs((prev) => [log, ...prev]);
    },
    [userId],
  );

  const updateLog = useCallback(
    async (id: string, data: Partial<Omit<CardioLog, 'id' | 'userId' | 'createdAt'>>) => {
      await storage.updateLog(userId, id, data);
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
    },
    [userId],
  );

  const deleteLog = useCallback(
    async (id: string) => {
      await storage.deleteLog(userId, id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    },
    [userId],
  );

  return {
    logs: filteredLogs,
    isLoading,
    activeCategory,
    setActiveCategory,
    createLog,
    updateLog,
    deleteLog,
  };
}
