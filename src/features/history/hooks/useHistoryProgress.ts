import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import * as historyService from '../services/historyService';
import type {
  CalendarMonthVM,
  DaySummaryVM,
  HistorySources,
  PrExerciseVM,
  WeeklyHabitScoreVM,
  WeeklyStreakVM,
} from '../types/historyTypes';

function toLocalDayISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthGridStart(year: number, monthIndex: number): Date {
  // Monday-based grid.
  const firstOfMonth = new Date(year, monthIndex, 1);
  const jsDay = firstOfMonth.getDay(); // 0 Sun..6 Sat
  const mondayOffset = (jsDay + 6) % 7; // 0 Mon..6 Sun
  return new Date(year, monthIndex, 1 - mondayOffset);
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = (day + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function createEmptyWeeklyStreak(baseDate = new Date()): WeeklyStreakVM {
  const todayISO = toLocalDayISO(baseDate);
  const monday = getMondayOfWeek(baseDate);
  const weekDays: WeeklyStreakVM['weekDays'] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateISO = toLocalDayISO(d);
    weekDays.push({
      dateISO,
      isActive: false,
      isToday: dateISO === todayISO,
    });
  }

  return {
    streakCount: 0,
    currentWeekHasActiveDay: false,
    weekDays,
  };
}

function createEmptyWeeklyHabitScore(baseDate = new Date()): WeeklyHabitScoreVM {
  const points: WeeklyHabitScoreVM['points'] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    points.push({
      dateISO: toLocalDayISO(d),
      value: 0,
    });
  }

  return {
    points,
    maxHabits: 8,
  };
}

function createEmptyHistorySources(baseDate = new Date()): HistorySources {
  return {
    daily: {
      workout: {},
      cardio: {},
      habits: {},
    },
    weeklyStreak: createEmptyWeeklyStreak(baseDate),
    weeklyHabitScore: createEmptyWeeklyHabitScore(baseDate),
    prExercises: [],
  };
}

function normalizeHistorySources(data: Partial<HistorySources> | null | undefined): HistorySources {
  const emptyHistory = createEmptyHistorySources();

  return {
    daily: {
      workout: data?.daily?.workout ?? {},
      cardio: data?.daily?.cardio ?? {},
      habits: data?.daily?.habits ?? {},
    },
    weeklyStreak: {
      streakCount: data?.weeklyStreak?.streakCount ?? 0,
      currentWeekHasActiveDay: data?.weeklyStreak?.currentWeekHasActiveDay ?? false,
      weekDays: data?.weeklyStreak?.weekDays?.length ? data.weeklyStreak.weekDays : emptyHistory.weeklyStreak.weekDays,
    },
    weeklyHabitScore: {
      points: data?.weeklyHabitScore?.points?.length
        ? data.weeklyHabitScore.points
        : emptyHistory.weeklyHabitScore.points,
      maxHabits: data?.weeklyHabitScore?.maxHabits ?? emptyHistory.weeklyHabitScore.maxHabits,
    },
    prExercises: data?.prExercises ?? [],
  };
}

export function useHistoryProgress() {
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const [sources, setSources] = useState<HistorySources>(() => createEmptyHistorySources());
  const [isLoading, setIsLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); // 0-11

  const [dayDialogVisible, setDayDialogVisible] = useState(false);
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [daySummary, setDaySummary] = useState<DaySummaryVM | null>(null);

  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setSources(createEmptyHistorySources());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await historyService.getHistorySources(userId);
      setSources(normalizeHistorySources(data));
    } catch {
      setSources(createEmptyHistorySources());
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const calendarMonth: CalendarMonthVM = useMemo(() => {
    const daily = sources.daily;
    const days: CalendarMonthVM['days'] = [];

    const gridStart = getMonthGridStart(selectedYear, selectedMonthIndex);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const dateISO = toLocalDayISO(d);
      const dayNumber = d.getDate();
      const isInCurrentMonth = d.getMonth() === selectedMonthIndex;

      days.push({
        dateISO,
        dayNumber,
        isInCurrentMonth,
        dots: {
          workout: Boolean(daily.workout[dateISO]?.sessionsCount),
          cardio: Boolean(daily.cardio[dateISO]?.logs?.length),
          habit: Boolean(daily.habits[dateISO]?.check && daily.habits[dateISO].check.score > 0),
        },
      });
    }

    return { year: selectedYear, monthIndex: selectedMonthIndex, days };
  }, [selectedYear, selectedMonthIndex, sources]);

  const selectedExercise: PrExerciseVM | null = useMemo(() => {
    if (!selectedExerciseId) return null;
    return sources.prExercises.find((p) => p.exerciseId === selectedExerciseId) ?? null;
  }, [sources, selectedExerciseId]);

  const onSelectDay = useCallback(
    (dateISO: string) => {
      setSelectedDayISO(dateISO);
      const summary = historyService.buildDaySummary(dateISO, sources.daily);
      setDaySummary(summary);
      setDayDialogVisible(true);
    },
    [sources],
  );

  const closeDayDialog = useCallback(() => {
    setDayDialogVisible(false);
    setSelectedDayISO(null);
    setDaySummary(null);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonthIndex((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonthIndex((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const openExerciseDialog = useCallback((exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setExerciseDialogVisible(true);
  }, []);

  const closeExerciseDialog = useCallback(() => {
    setExerciseDialogVisible(false);
    setSelectedExerciseId(null);
  }, []);

  return {
    isLoading,
    reload: load,

    calendarMonth,
    goToPreviousMonth,
    goToNextMonth,

    dayDialogVisible,
    selectedDayISO,
    daySummary,
    closeDayDialog,
    onSelectDay,

    weeklyStreak: sources.weeklyStreak,
    weeklyHabitScore: sources.weeklyHabitScore,
    prExercises: sources.prExercises,

    exerciseDialogVisible,
    selectedExercise,
    closeExerciseDialog,
    openExerciseDialog,
  };
}
