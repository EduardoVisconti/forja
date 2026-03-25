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
  completedSets: Record<string, number>;
  completedExercises: Record<string, boolean>;
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
  completedSets: {},
  completedExercises: {},
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
      completedSets: {},
      completedExercises: {},
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
      completedSets: {},
      completedExercises: {},
      setLogs: [],
      restSecondsRemaining: null,
      timerRunning: false,
    }),

  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

  skipExercise: (index) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) =>
        i === index ? { ...ex, skipped: true } : ex,
      );
      return { exercises };
    }),

  reorderExercises: (exercises) => set({ exercises }),

  logSet: (log) =>
    set((state) => {
      const setLogs = [...state.setLogs, log];
      const currentCompleted = state.completedSets[log.exerciseId] ?? 0;
      const completedSets = {
        ...state.completedSets,
        [log.exerciseId]: Math.max(currentCompleted, log.setNumber),
      };

      const exercise = state.exercises.find((item) => item.id === log.exerciseId);
      const isExerciseCompleted = exercise
        ? completedSets[log.exerciseId] >= exercise.sets
        : false;
      const completedExercises = isExerciseCompleted
        ? { ...state.completedExercises, [log.exerciseId]: true }
        : state.completedExercises;

      return { setLogs, completedSets, completedExercises };
    }),

  advanceSet: () =>
    set((state) => {
      const currentExercise = state.exercises[state.currentExerciseIndex];
      if (!currentExercise) return {};
      const currentCompleted = state.completedSets[currentExercise.id] ?? 0;
      if (currentCompleted < currentExercise.sets) return {};

      // Find next non-skipped exercise
      let nextIndex = state.currentExerciseIndex + 1;
      while (nextIndex < state.exercises.length) {
        const nextExercise = state.exercises[nextIndex];
        if (!nextExercise.skipped && !state.completedExercises[nextExercise.id]) {
          break;
        }
        nextIndex++;
      }

      if (nextIndex >= state.exercises.length) {
        return {};
      }

      return { currentExerciseIndex: nextIndex };
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
