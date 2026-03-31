import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_HABITS_CONFIG,
  HABIT_KEYS,
  type HabitCheck,
  type HabitCheckItem,
  type HabitConfig,
  type HabitKey,
} from '../types';

const checksKey = (userId: string) => `habits:checks:${userId}`;
const configKey = (userId: string) => `habits:config:${userId}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Legacy check format (pre-migration) with boolean fields per HabitKey */
interface LegacyHabitCheck {
  id: string;
  userId: string;
  date: string;
  score: number;
  createdAt: string;
  [key: string]: unknown;
}

function isNewFormat(check: unknown): check is HabitCheck {
  return (
    typeof check === 'object' &&
    check !== null &&
    Array.isArray((check as HabitCheck).habits)
  );
}

function migrateCheck(check: LegacyHabitCheck): HabitCheck {
  const habits: HabitCheckItem[] = HABIT_KEYS.map((key) => ({
    habitId: key,
    checked: Boolean(check[key]),
  }));
  const score = habits.filter((h) => h.checked).length;
  return {
    id: check.id,
    userId: check.userId,
    date: check.date,
    score,
    totalActive: HABIT_KEYS.length,
    habits,
    createdAt: check.createdAt,
  };
}

export async function getConfig(userId: string): Promise<HabitConfig[] | null> {
  const raw = await AsyncStorage.getItem(configKey(userId));
  return raw ? (JSON.parse(raw) as HabitConfig[]) : null;
}

export async function saveConfig(userId: string, config: HabitConfig[]): Promise<void> {
  await AsyncStorage.setItem(configKey(userId), JSON.stringify(config));
}

export async function seedDefaultHabits(userId: string): Promise<HabitConfig[]> {
  const config: HabitConfig[] = HABIT_KEYS.map((key) => ({
    id: `${userId}_${key}`,
    label: DEFAULT_HABITS_CONFIG[key].label,
    emoji: DEFAULT_HABITS_CONFIG[key].emoji,
    active: true,
  }));
  await saveConfig(userId, config);
  return config;
}

export async function getChecks(userId: string): Promise<HabitCheck[]> {
  const raw = await AsyncStorage.getItem(checksKey(userId));
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown[];
  const migrated: HabitCheck[] = parsed.map((c) =>
    isNewFormat(c) ? c : migrateCheck(c as LegacyHabitCheck),
  );
  const needsSave = parsed.some((c) => !isNewFormat(c));
  if (needsSave) {
    await saveChecks(userId, migrated);
  }
  return migrated;
}

export async function saveChecks(userId: string, checks: HabitCheck[]): Promise<void> {
  await AsyncStorage.setItem(checksKey(userId), JSON.stringify(checks));
}

export async function getTodayCheck(userId: string): Promise<HabitCheck | null> {
  return getCheckForDate(userId, todayISO());
}

export async function getCheckForDate(userId: string, dateISO: string): Promise<HabitCheck | null> {
  const checks = await getChecks(userId);
  return checks.find((c) => c.date === dateISO) ?? null;
}

export async function autoCheckExerciseHabit(userId: string): Promise<void> {
  const configs = await getConfig(userId);
  if (!configs) return;

  const exerciseHabit = configs.find(
    (c) =>
      c.active &&
      (c.id.toLowerCase().includes('exercis') || c.label.toLowerCase().includes('exercit')),
  );
  if (!exerciseHabit) return;

  const now = new Date();
  const todayDateISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCheck = await getCheckForDate(userId, todayDateISO);

  if (todayCheck) {
    const alreadyChecked = todayCheck.habits.find(
      (h) => h.habitId === exerciseHabit.id && h.checked,
    );
    if (alreadyChecked) return;
  }

  const activeHabitIds = configs.filter((c) => c.active).map((c) => c.id);
  await upsertCheck(userId, exerciseHabit.id, true, activeHabitIds, todayDateISO);
}

/**
 * Creates or updates a check for today with the given habit toggle.
 * Only used when viewing today (toggles disabled otherwise).
 */
export async function upsertCheck(
  userId: string,
  habitId: string,
  value: boolean,
  activeHabitIds: string[],
  dateISO: string,
): Promise<HabitCheck> {
  const checks = await getChecks(userId);
  const existingIndex = checks.findIndex((c) => c.date === dateISO);
  const totalActive = activeHabitIds.length;

  let updated: HabitCheck;

  if (existingIndex >= 0) {
    const existing = checks[existingIndex];
    const habits: HabitCheckItem[] = activeHabitIds.map((id) => ({
      habitId: id,
      checked: id === habitId ? value : (existing.habits.find((h) => h.habitId === id)?.checked ?? false),
    }));
    const score = habits.filter((h) => h.checked).length;
    // Garante que a data do registro continua consistente com a tela atual.
    updated = { ...existing, date: dateISO, habits, score, totalActive };
    checks[existingIndex] = updated;
  } else {
    const habits: HabitCheckItem[] = activeHabitIds.map((id) => ({
      habitId: id,
      checked: id === habitId ? value : false,
    }));
    const score = habits.filter((h) => h.checked).length;
    updated = {
      id: generateId(),
      userId,
      date: dateISO,
      score,
      totalActive,
      habits,
      createdAt: new Date().toISOString(),
    };
    checks.push(updated);
  }

  await saveChecks(userId, checks);
  return updated;
}
