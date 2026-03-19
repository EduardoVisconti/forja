export const HABIT_KEYS = [
  'sun_exposure',
  'sleep_7h',
  'water',
  'no_late_caffeine',
  'ate_healthy',
  'exercised',
  'read',
  'digital_balance',
] as const;

export type HabitKey = (typeof HABIT_KEYS)[number];

export type HabitValues = Record<HabitKey, boolean>;

export interface HabitCheck extends HabitValues {
  id: string;
  userId: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** Number of checked habits (0–8) */
  score: number;
  createdAt: string;
}
