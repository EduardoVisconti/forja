import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import * as historyService from '../services/historyService';
import type {
  CalendarMonthVM,
  DaySummaryVM,
  HistorySources,
  PrExerciseVM,
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

export function useHistoryProgress() {
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const [sources, setSources] = useState<HistorySources | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); // 0-11

  const [dayDialogVisible, setDayDialogVisible] = useState(false);
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [daySummary, setDaySummary] = useState<DaySummaryVM | null>(null);

  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    historyService
      .getHistorySources(userId)
      .then((data) => {
        if (!mounted) return;
        setSources(data);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const calendarMonth: CalendarMonthVM = useMemo(() => {
    const daily = sources?.daily;
    const days: CalendarMonthVM['days'] = [];
    if (!daily) {
      for (let i = 0; i < 42; i++) {
        days.push({
          dateISO: '',
          dayNumber: 0,
          isInCurrentMonth: false,
          dots: { workout: false, cardio: false, habit: false },
        });
      }
      return { year: selectedYear, monthIndex: selectedMonthIndex, days };
    }

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
    if (!sources || !selectedExerciseId) return null;
    return sources.prExercises.find((p) => p.exerciseId === selectedExerciseId) ?? null;
  }, [sources, selectedExerciseId]);

  const onSelectDay = useCallback(
    (dateISO: string) => {
      setSelectedDayISO(dateISO);
      if (!sources) return;
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
    error,

    calendarMonth,
    goToPreviousMonth,
    goToNextMonth,

    dayDialogVisible,
    selectedDayISO,
    daySummary,
    closeDayDialog,
    onSelectDay,

    weeklyVolume: sources?.weeklyVolume ?? null,
    weeklyHabitScore: sources?.weeklyHabitScore ?? null,
    prExercises: sources?.prExercises ?? [],

    exerciseDialogVisible,
    selectedExercise,
    closeExerciseDialog,
    openExerciseDialog,
  };
}

