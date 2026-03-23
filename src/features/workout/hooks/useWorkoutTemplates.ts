import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as storage from '../services/workoutStorage';
import type { WorkoutTemplate } from '../types';

export function useWorkoutTemplates() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await storage.seedDefaultTemplates(userId);
      const data = await storage.getTemplates(userId);
      setTemplates(data.sort((a, b) => a.orderIndex - b.orderIndex));
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
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      triggerSync();
    },
    [userId],
  );

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, reload: load };
}
