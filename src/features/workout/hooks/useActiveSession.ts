import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import { autoCheckExerciseHabit } from '@/features/habits/services/habitStorage';
import { getSetLogs, saveSession, saveSetLogs } from '../services/sessionStorage';
import {
  getExercises,
  parseRepsForVolume,
  updateExerciseWeightsFromSession,
} from '../services/workoutStorage';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';
import type { SessionExercise, SetLog } from '../types/session';
import type { WorkoutTemplate } from '../types/index';

export function useActiveSession() {
  const router = useRouter();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const store = useWorkoutSessionStore();
  const finishRef = useRef<(() => Promise<void>) | null>(null);

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

  const finishSession = useCallback(async () => {
    const { sessionId, templateId, templateName, startedAt, setLogs, exercises, completedExercises } =
      store;
    if (!sessionId || !templateId || !startedAt) return;

    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000,
    );
    const totalVolumeKg = setLogs.reduce(
      (sum, l) => sum + parseRepsForVolume(String(l.repsDone)) * l.weightKg,
      0,
    );

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

    const allSetLogs = await getSetLogs(sessionId);
    const completedExerciseIds = new Set(
      exercises.filter((exercise) => completedExercises[exercise.id]).map((exercise) => exercise.id),
    );
    const completedSetLogs = allSetLogs.filter((log) => completedExerciseIds.has(log.exerciseId));
    await updateExerciseWeightsFromSession(userId, templateId, completedSetLogs);

    const authUserId = useAuthStore.getState().user?.id;
    if (authUserId) {
      await autoCheckExerciseHabit(authUserId);
    }

    triggerSync();
    store.endSession();
    router.replace(`/workout/summary/${sessionId}` as never);
  }, [store, userId, router]);

  finishRef.current = finishSession;

  const completeSet = useCallback(
    (
      repsDone: number,
      weightKg: number,
      options?: {
        startRestTimer?: boolean;
      },
    ) => {
      const { sessionId, currentExerciseIndex, exercises, completedSets, completedExercises } =
        store;
      if (!sessionId) return;

      const exercise = exercises[currentExerciseIndex];
      if (!exercise) return;
      const currentSetNumber = Math.min((completedSets[exercise.id] ?? 0) + 1, exercise.sets);
      if ((completedSets[exercise.id] ?? 0) >= exercise.sets) return;

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
      const shouldStartRestTimer = options?.startRestTimer ?? true;
      if (shouldStartRestTimer) {
        store.startRestTimer(exercise.restSeconds || 60);
      } else {
        store.advanceSet();
      }

      const willCompleteCurrentExercise = currentSetNumber >= exercise.sets;
      const allDone = exercises.every((ex) => {
        if (ex.skipped) return true;
        if (ex.id === exercise.id) return willCompleteCurrentExercise;
        return Boolean(completedExercises[ex.id]);
      });

      if (willCompleteCurrentExercise && allDone) {
        setTimeout(() => {
          Alert.alert(
            t('session.workoutComplete'),
            t('session.workoutCompleteMessage'),
            [
              { text: t('session.continueLbl'), style: 'cancel' },
              { text: t('session.finish'), style: 'default', onPress: () => finishRef.current?.() },
            ],
          );
        }, 0);
      }
    },
    [store, t],
  );

  return {
    ...store,
    startSession,
    completeSet,
    finishSession,
  };
}
