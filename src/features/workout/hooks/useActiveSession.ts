import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '@/core/auth/authStore';
import { saveSession, saveSetLogs } from '../services/sessionStorage';
import { getExercises } from '../services/workoutStorage';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';
import type { SessionExercise, SetLog } from '../types/session';
import type { WorkoutTemplate } from '../types/index';

export function useActiveSession() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const store = useWorkoutSessionStore();

  const startSession = useCallback(
    async (template: WorkoutTemplate) => {
      const exercises = await getExercises(template.id);
      const sessionExercises: SessionExercise[] = exercises.map((ex) => ({
        ...ex,
        skipped: false,
      }));

      const sessionId = Crypto.randomUUID();
      store.startSession({
        sessionId,
        templateId: template.id,
        templateName: template.name,
        userId,
        exercises: sessionExercises,
      });

      router.push(`/workout/${template.id}` as never);
    },
    [userId, store, router],
  );

  const completeSet = useCallback(
    (repsDone: number, weightKg: number) => {
      const { sessionId, currentExerciseIndex, currentSetNumber, exercises } = store;
      if (!sessionId) return;

      const exercise = exercises[currentExerciseIndex];
      if (!exercise) return;

      const log: SetLog = {
        id: Crypto.randomUUID(),
        sessionId,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        setNumber: currentSetNumber,
        repsDone,
        weightKg,
        completedAt: new Date().toISOString(),
      };

      store.logSet(log);
      store.startRestTimer(exercise.restSeconds || 60);
    },
    [store],
  );

  const finishSession = useCallback(async () => {
    const { sessionId, templateId, templateName, startedAt, setLogs, exercises } = store;
    if (!sessionId || !templateId || !startedAt) return;

    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000,
    );
    const totalVolumeKg = setLogs.reduce((sum, l) => sum + l.repsDone * l.weightKg, 0);

    await saveSetLogs(sessionId, setLogs);
    await saveSession({
      id: sessionId,
      userId,
      templateId,
      templateName,
      startedAt,
      finishedAt,
      durationMinutes,
      totalVolumeKg,
    });

    store.endSession();
    router.replace(`/workout/summary/${sessionId}` as never);
  }, [store, userId, router]);

  return {
    ...store,
    startSession,
    completeSet,
    finishSession,
  };
}
