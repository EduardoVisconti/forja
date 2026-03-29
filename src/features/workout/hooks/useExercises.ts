import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as storage from '../services/workoutStorage';
import type { Exercise } from '../types';

export function useExercises(templateId: string) {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!templateId) return;
    setIsLoading(true);
    try {
      const data = await storage.getExercises(templateId);
      setExercises(data.sort((a, b) => a.orderIndex - b.orderIndex));
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  const addExercise = useCallback(
    async (data: Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>) => {
      const created = await storage.addExercise(templateId, data);
      setExercises((prev) => [...prev, created]);
      triggerSync();
      return created;
    },
    [templateId],
  );

  const updateExercise = useCallback(
    async (id: string, data: Partial<Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>>) => {
      await storage.updateExercise(templateId, id, data);
      setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
      triggerSync();
    },
    [templateId],
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      await storage.deleteExercise(userId, templateId, id);
      setExercises((prev) => {
        const filtered = prev.filter((e) => e.id !== id);
        return filtered.map((e, i) => ({ ...e, orderIndex: i }));
      });
      triggerSync();
    },
    [templateId, userId],
  );

  const moveExercise = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      await storage.reorderExercise(templateId, id, direction);
      setExercises((prev) => {
        const index = prev.findIndex((e) => e.id === id);
        if (index === -1) return prev;
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= prev.length) return prev;
        const reordered = [...prev];
        [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
        return reordered.map((e, i) => ({ ...e, orderIndex: i }));
      });
      triggerSync();
    },
    [templateId],
  );

  return { exercises, isLoading, addExercise, updateExercise, deleteExercise, moveExercise };
}
