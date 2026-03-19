import AsyncStorage from '@react-native-async-storage/async-storage';
import { HABIT_KEYS, type HabitCheck, type HabitKey, type HabitValues } from '../types';

const checksKey = (userId: string) => `habits:checks:${userId}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const DEFAULT_HABITS: HabitValues = {
  sun_exposure: false,
  sleep_7h: false,
  water: false,
  no_late_caffeine: false,
  ate_healthy: false,
  exercised: false,
  read: false,
  digital_balance: false,
};

export async function getChecks(userId: string): Promise<HabitCheck[]> {
  const raw = await AsyncStorage.getItem(checksKey(userId));
  return raw ? (JSON.parse(raw) as HabitCheck[]) : [];
}

async function saveChecks(userId: string, checks: HabitCheck[]): Promise<void> {
  await AsyncStorage.setItem(checksKey(userId), JSON.stringify(checks));
}

export async function getTodayCheck(userId: string): Promise<HabitCheck | null> {
  const checks = await getChecks(userId);
  return checks.find((c) => c.date === todayISO()) ?? null;
}

/**
 * Creates today's record if it doesn't exist, or updates a single habit key.
 * Recalculates score after each toggle.
 */
export async function upsertCheck(
  userId: string,
  key: HabitKey,
  value: boolean,
): Promise<HabitCheck> {
  const checks = await getChecks(userId);
  const today = todayISO();
  const existingIndex = checks.findIndex((c) => c.date === today);

  let updated: HabitCheck;

  if (existingIndex >= 0) {
    const existing = checks[existingIndex];
    const habits: HabitValues = { ...DEFAULT_HABITS };
    for (const k of HABIT_KEYS) {
      habits[k] = existing[k];
    }
    habits[key] = value;

    const score = HABIT_KEYS.filter((k) => habits[k]).length;
    updated = { ...existing, ...habits, score };
    checks[existingIndex] = updated;
  } else {
    const habits: HabitValues = { ...DEFAULT_HABITS, [key]: value };
    const score = HABIT_KEYS.filter((k) => habits[k]).length;
    updated = {
      ...habits,
      id: generateId(),
      userId,
      date: today,
      score,
      createdAt: new Date().toISOString(),
    };
    checks.push(updated);
  }

  await saveChecks(userId, checks);
  return updated;
}
