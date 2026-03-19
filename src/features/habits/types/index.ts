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

export interface HabitConfig {
  id: string;
  label: string;
  emoji: string;
  active: boolean;
}

export interface HabitCheckItem {
  habitId: string;
  checked: boolean;
}

export interface HabitCheck {
  id: string;
  userId: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** Number of checked habits */
  score: number;
  /** Total active habits for score calculation */
  totalActive: number;
  habits: HabitCheckItem[];
  createdAt: string;
}

/** Default habit configs for seeding (maps HabitKey to initial HabitConfig) */
export const DEFAULT_HABITS_CONFIG: Record<HabitKey, { label: string; emoji: string }> = {
  sun_exposure: { label: 'Sol matinal', emoji: '☀️' },
  sleep_7h: { label: 'Dormiu 7h+', emoji: '😴' },
  water: { label: 'Bebeu 3–4L de água', emoji: '💧' },
  no_late_caffeine: { label: 'Sem cafeína após 15h', emoji: '☕' },
  ate_healthy: { label: 'Comeu 80%+ saudável', emoji: '🥗' },
  exercised: { label: 'Se exercitou hoje', emoji: '🏋️' },
  read: { label: 'Leu algo leve', emoji: '📖' },
  digital_balance: { label: 'Equilíbrio digital', emoji: '📵' },
};
