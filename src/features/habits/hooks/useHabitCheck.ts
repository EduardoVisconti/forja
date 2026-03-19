import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { getChecks, getTodayCheck, upsertCheck } from '../services/habitStorage';
import { HABIT_KEYS, type HabitCheck, type HabitKey } from '../types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
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
      // Today exists but has no checks — don't count today, start from yesterday
      expected = new Date(new Date(today).getTime() - 86_400_000).toISOString().split('T')[0];
      continue;
    }
    if (diffDays(date, expected) > 1) break;
    if (check.score === 0) break;
    streak++;
    expected = new Date(new Date(date).getTime() - 86_400_000).toISOString().split('T')[0];
  }

  return streak;
}

const DEFAULT_HABIT_VALUES = Object.fromEntries(
  HABIT_KEYS.map((k) => [k, false]),
) as Record<HabitKey, boolean>;

export function useHabitCheck() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [todayCheck, setTodayCheck] = useState<HabitCheck | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const [today, all] = await Promise.all([getTodayCheck(userId), getChecks(userId)]);
      setTodayCheck(today);
      setStreak(computeStreak(all));
      setIsLoading(false);
    };

    load();
  }, [userId]);

  const toggleHabit = useCallback(
    async (key: HabitKey, value: boolean) => {
      const updated = await upsertCheck(userId, key, value);
      setTodayCheck(updated);

      // Recompute streak after toggle (today's score may have changed)
      const all = await getChecks(userId);
      setStreak(computeStreak(all));
    },
    [userId],
  );

  const habitValues = todayCheck
    ? (Object.fromEntries(HABIT_KEYS.map((k) => [k, todayCheck[k]])) as Record<HabitKey, boolean>)
    : DEFAULT_HABIT_VALUES;

  const score = todayCheck?.score ?? 0;

  return {
    habitValues,
    score,
    streak,
    isLoading,
    toggleHabit,
  };
}
