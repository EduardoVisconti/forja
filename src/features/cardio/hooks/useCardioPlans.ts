import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as storage from '../services/cardioPlanStorage';
import type { CardioPlan } from '../types/plans';

type CreatePlanData = Omit<
  CardioPlan,
  'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt' | 'completedAt' | 'completedRecordId'
>;

type UpdatePlanData = Partial<
  Omit<CardioPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export function useCardioPlans() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [plans, setPlans] = useState<CardioPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setPlans([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await storage.getPlans(userId);
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingPlans = useMemo(
    () =>
      plans
        .filter((plan) => plan.status === 'pending')
        .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)),
    [plans],
  );

  const completedPlans = useMemo(
    () =>
      plans
        .filter((plan) => plan.status === 'completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
        .slice(0, 10),
    [plans],
  );

  const createPlan = useCallback(
    async (data: CreatePlanData) => {
      const plan = await storage.createPlan(userId, data);
      setPlans((prev) => [...prev, plan]);
      triggerSync();
      return plan;
    },
    [userId],
  );

  const updatePlan = useCallback(
    async (id: string, data: UpdatePlanData) => {
      await storage.updatePlan(userId, id, data);
      const latest = await storage.getPlans(userId);
      setPlans(latest);
      triggerSync();
    },
    [userId],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      await storage.deletePlan(userId, id);
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      triggerSync();
    },
    [userId],
  );

  const completePlan = useCallback(
    async (planId: string, recordId: string) => {
      const completedAt = new Date().toISOString();
      await storage.updatePlan(userId, planId, {
        status: 'completed',
        completedAt,
        completedRecordId: recordId,
      });

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                status: 'completed',
                completedAt,
                completedRecordId: recordId,
                updatedAt: new Date().toISOString(),
              }
            : plan,
        ),
      );
      triggerSync();
    },
    [userId],
  );

  return {
    plans,
    isLoading,
    error,
    pendingPlans,
    completedPlans,
    createPlan,
    updatePlan,
    deletePlan,
    completePlan,
    reload: load,
  };
}
