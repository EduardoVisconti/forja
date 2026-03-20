import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import {
  getCheckForDate,
  getChecks,
  getConfig,
  saveConfig as saveConfigToStorage,
  seedDefaultHabits,
  upsertCheck,
} from '../services/habitStorage';
import type { HabitCheck, HabitConfig } from '../types';

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diffDays(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msA - msB) / 86_400_000);
}

/**
 * Calculates the streak of consecutive days with score > 0.
 * Includes today if score > 0, then counts backwards.
 */
function computeStreak(checks: HabitCheck[]): number {
  const today = todayISO();
  const byDate = new Map(checks.map((c) => [c.date, c]));

  const sorted = [...byDate.keys()].sort((a, b) => (a > b ? -1 : 1));
  if (sorted.length === 0) return 0;

  let streak = 0;
  let expected = today;

  for (const date of sorted) {
    const check = byDate.get(date)!;
    if (date === today && check.score === 0) {
      expected = addDays(today, -1);
      continue;
    }
    if (diffDays(date, expected) > 1) break;
    if (check.score === 0) break;
    streak++;
    expected = addDays(date, -1);
  }

  return streak;
}

export function useHabitCheck() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [habitConfigs, setHabitConfigs] = useState<HabitConfig[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<HabitCheck | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const today = todayISO();
  const minDate = yesterdayISO();
  const isToday = selectedDate === today;
  const canGoBack = selectedDate !== minDate;
  const isEditable = selectedDate === today || selectedDate === minDate;

  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      if (prev === minDate) return prev;
      return addDays(prev, -1);
    });
  }, [minDate]);

  const goToNextDay = useCallback(() => {
    if (selectedDate === today) return;
    setSelectedDate((prev) => addDays(prev, 1));
  }, [selectedDate, today]);

  const goToToday = useCallback(() => {
    setSelectedDate(today);
  }, [today]);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      let config = await getConfig(userId);
      if (!config || config.length === 0) {
        config = await seedDefaultHabits(userId);
      }
      setHabitConfigs(config);

      const [check, all] = await Promise.all([
        getCheckForDate(userId, selectedDate),
        getChecks(userId),
      ]);
      setSelectedCheck(check);
      setStreak(computeStreak(all));
      setIsLoading(false);
    };

    setIsLoading(true);
    load();
  }, [userId, selectedDate]);

  const toggleHabit = useCallback(
    async (habitId: string, value: boolean) => {
      if (!isEditable) return;

      const activeIds = habitConfigs.filter((c) => c.active).map((c) => c.id);
      const updated = await upsertCheck(userId, habitId, value, activeIds);
      setSelectedCheck(updated);

      const all = await getChecks(userId);
      setStreak(computeStreak(all));
    },
    [userId, isEditable, habitConfigs],
  );

  const refreshConfigs = useCallback(async () => {
    if (!userId) return;
    const config = await getConfig(userId);
    if (config) setHabitConfigs(config);
  }, [userId]);

  const activeConfigs = habitConfigs.filter((c) => c.active);

  const habitValues: Record<string, boolean> = activeConfigs.reduce<Record<string, boolean>>(
    (acc, c) => {
      acc[c.id] = selectedCheck?.habits.find((h) => h.habitId === c.id)?.checked ?? false;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const score = selectedCheck?.score ?? 0;
  const totalActive = activeConfigs.length;

  return {
    selectedDate,
    isToday,
    canGoBack,
    isEditable,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    habitConfigs: activeConfigs,
    allHabitConfigs: habitConfigs,
    habitValues,
    score,
    totalActive,
    streak,
    isLoading,
    toggleHabit,
    refreshConfigs,
    saveConfig: useCallback(
      async (configs: HabitConfig[]) => {
        await saveConfigToStorage(userId, configs);
        setHabitConfigs(configs);
      },
      [userId],
    ),
  };
}
