import { create } from 'zustand';
import type { SessionExercise, SetLog } from '../types/session';

export interface ActiveSessionState {
  sessionId: string | null;
  templateId: string | null;
  templateName: string;
  userId: string | null;
  startedAt: string | null;
  exercises: SessionExercise[];
  currentExerciseIndex: number;
  currentSetNumber: number;
  setLogs: SetLog[];
  /** null = no rest timer running */
  restSecondsRemaining: number | null;
  timerRunning: boolean;
}

interface ActiveSessionActions {
  startSession: (params: {
    sessionId: string;
    templateId: string;
    templateName: string;
    userId: string;
    exercises: SessionExercise[];
  }) => void;
  endSession: () => void;
  setCurrentExerciseIndex: (index: number) => void;
  skipExercise: (index: number) => void;
  reorderExercises: (exercises: SessionExercise[]) => void;
  logSet: (log: SetLog) => void;
  advanceSet: () => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  skipRestTimer: () => void;
  addRestTime: (seconds: number) => void;
}

type WorkoutSessionStore = ActiveSessionState & ActiveSessionActions;

export const useWorkoutSessionStore = create<WorkoutSessionStore>((set) => ({
  sessionId: null,
  templateId: null,
  templateName: '',
  userId: null,
  startedAt: null,
  exercises: [],
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  setLogs: [],
  restSecondsRemaining: null,
  timerRunning: false,

  startSession: ({ sessionId, templateId, templateName, userId, exercises }) =>
    set({
      sessionId,
      templateId,
      templateName,
      userId,
      startedAt: new Date().toISOString(),
      exercises,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      setLogs: [],
      restSecondsRemaining: null,
      timerRunning: false,
    }),

  endSession: () =>
    set({
      sessionId: null,
      templateId: null,
      templateName: '',
      userId: null,
      startedAt: null,
      exercises: [],
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      setLogs: [],
      restSecondsRemaining: null,
      timerRunning: false,
    }),

  setCurrentExerciseIndex: (index) =>
    set({ currentExerciseIndex: index, currentSetNumber: 1 }),

  skipExercise: (index) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) =>
        i === index ? { ...ex, skipped: true } : ex,
      );
      return { exercises };
    }),

  reorderExercises: (exercises) => set({ exercises }),

  logSet: (log) => set((state) => ({ setLogs: [...state.setLogs, log] })),

  advanceSet: () =>
    set((state) => {
      const currentExercise = state.exercises[state.currentExerciseIndex];
      if (!currentExercise) return {};

      if (state.currentSetNumber < currentExercise.sets) {
        return { currentSetNumber: state.currentSetNumber + 1 };
      }

      // Find next non-skipped exercise
      let nextIndex = state.currentExerciseIndex + 1;
      while (nextIndex < state.exercises.length && state.exercises[nextIndex].skipped) {
        nextIndex++;
      }

      if (nextIndex >= state.exercises.length) {
        return { currentSetNumber: state.currentSetNumber };
      }

      return { currentExerciseIndex: nextIndex, currentSetNumber: 1 };
    }),

  startRestTimer: (seconds) =>
    set({ restSecondsRemaining: seconds, timerRunning: true }),

  tickRestTimer: () =>
    set((state) => {
      if (state.restSecondsRemaining === null) return {};
      if (state.restSecondsRemaining <= 1) {
        return { restSecondsRemaining: 0, timerRunning: false };
      }
      return { restSecondsRemaining: state.restSecondsRemaining - 1 };
    }),

  skipRestTimer: () => set({ restSecondsRemaining: null, timerRunning: false }),

  addRestTime: (seconds) =>
    set((state) => ({
      restSecondsRemaining: (state.restSecondsRemaining ?? 0) + seconds,
    })),
}));
