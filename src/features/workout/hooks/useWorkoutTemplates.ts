import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as storage from '../services/workoutStorage';
import type { WorkoutTemplate } from '../types';

export function useWorkoutTemplates() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setTemplates([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await storage.seedDefaultTemplates(userId);
      const data = await storage.getTemplates(userId);
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = useCallback(
    async (data: Pick<WorkoutTemplate, 'name' | 'type'>) => {
      const created = await storage.createTemplate(userId, data);
      setTemplates((prev) => [...prev, created]);
      triggerSync();
      return created;
    },
    [userId],
  );

  const updateTemplate = useCallback(
    async (id: string, data: Partial<Pick<WorkoutTemplate, 'name' | 'type'>>) => {
      await storage.updateTemplate(userId, id, data);
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      triggerSync();
    },
    [userId],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await storage.deleteTemplate(userId, id);
      setTemplates((prev) =>
        prev
          .filter((t) => t.id !== id)
          .map((template, index) => ({ ...template, order_index: index, orderIndex: index })),
      );
      triggerSync();
    },
    [userId],
  );

  const reorderTemplates = useCallback(
    async (newOrder: WorkoutTemplate[]) => {
      const reordered = newOrder.map((template, index) => ({
        ...template,
        order_index: index,
        orderIndex: index,
      }));

      setTemplates(reordered);
      await storage.saveTemplates(userId, reordered);
      triggerSync();
    },
    [userId],
  );

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    reload: load,
  };
}
