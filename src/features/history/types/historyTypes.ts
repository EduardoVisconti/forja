import type { CardioLog } from '@/features/cardio/types';
import type { HabitCheck } from '@/features/habits/types';
import type { WorkoutSession, SetLog } from '@/features/workout/types/session';

export type TemplateGroup = 'pull' | 'push' | 'legs' | 'custom';

export interface WorkoutDayAgg {
  sessionsCount: number;
  totalVolumeKg: number;
  templateNames: string[];
  volumeByGroupKg: Record<TemplateGroup, number>;
}

export interface CardioDayAgg {
  logs: CardioLog[];
  totalDurationMinutes: number;
}

export interface HabitDayAgg {
  check: HabitCheck;
  checkedHabits: Array<{
    habitId: string;
    label: string;
    emoji: string;
  }>;
}

export interface HistoryDailyAgg {
  workout: Record<string, WorkoutDayAgg>;
  cardio: Record<string, CardioDayAgg>;
  habits: Record<string, HabitDayAgg>;
}

export interface WeeklyVolumeBarItem {
  group: TemplateGroup;
  labelKey: string;
  valueKg: number;
  color: string;
}

export interface WeeklyVolumeVM {
  items: WeeklyVolumeBarItem[];
  maxValueKg: number;
}

export interface WeeklyHabitScorePoint {
  dateISO: string;
  value: number;
}

export interface WeeklyHabitScoreVM {
  points: WeeklyHabitScorePoint[];
  maxHabits: number;
}

export interface PrSessionWeightPoint {
  sessionId: string;
  dateISO: string;
  finishedAt: string;
  weightKg: number;
}

export interface PrExerciseVM {
  exerciseId: string;
  exerciseName: string;
  bestWeightKg: number;
  bestAtISO: string;
  sessionCount: number;
  progression: PrSessionWeightPoint[];
}

export interface DaySummaryVM {
  dateISO: string;
  hasWorkout: boolean;
  hasCardio: boolean;
  hasHabits: boolean;
  workout?: WorkoutDayAgg;
  cardio?: CardioDayAgg;
  habits?: HabitDayAgg;
}

export interface CalendarDayVM {
  dateISO: string;
  dayNumber: number;
  isInCurrentMonth: boolean;
  dots: {
    workout: boolean;
    cardio: boolean;
    habit: boolean;
  };
}

export interface CalendarMonthVM {
  year: number;
  monthIndex: number; // 0-11
  days: CalendarDayVM[];
}

export interface HistorySources {
  daily: HistoryDailyAgg;
  weeklyVolume: WeeklyVolumeVM;
  weeklyHabitScore: WeeklyHabitScoreVM;
  prExercises: PrExerciseVM[];
}

export type SetLogWithDateISO = SetLog & {
  completedDateISO: string;
};

