import { useEffect, useState } from 'react';
import { getAllSetLogsForExercise, getSetLogs } from '../services/sessionStorage';
import type { SetLog } from '../types/session';

export interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  bestSetWeightKg: number;
  bestSetReps: number;
  isPR: boolean;
  previousBestKg: number | null;
  diffKg: number | null;
}

export interface SessionSummary {
  totalVolumeKg: number;
  durationMinutes: number;
  exerciseSummaries: ExerciseSummary[];
  setLogs: SetLog[];
}

export function useSessionSummary(
  sessionId: string,
  userId: string,
  totalVolumeKg: number,
  durationMinutes: number,
) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const loadSummary = async () => {
      try {
        const logs = await getSetLogs(sessionId);
        const exerciseIds = [...new Set(logs.map((l) => l.exerciseId))];
        const exerciseComparisonById = new Map<
          string,
          { previousBestKg: number | null; diffKg: number | null; isPR: boolean }
        >();

        for (const exerciseId of exerciseIds) {
          const allLogs = await getAllSetLogsForExercise(userId, exerciseId);
          const sessionLogs = allLogs.filter((l) => l.sessionId === sessionId);
          const previousLogs = allLogs.filter((l) => l.sessionId !== sessionId);

          if (sessionLogs.length === 0) continue;

          const maxCurrentWeight = Math.max(...sessionLogs.map((l) => l.weightKg));
          const previousBestKg =
            previousLogs.length > 0 ? Math.max(...previousLogs.map((l) => l.weightKg)) : null;
          const diffKg = previousBestKg !== null ? maxCurrentWeight - previousBestKg : null;
          const isPR = diffKg !== null ? diffKg > 0 : false;

          exerciseComparisonById.set(exerciseId, { previousBestKg, diffKg, isPR });
        }

        const logsByExercise = new Map<string, SetLog[]>();
        for (const log of logs) {
          const exerciseLogs = logsByExercise.get(log.exerciseId) ?? [];
          exerciseLogs.push(log);
          logsByExercise.set(log.exerciseId, exerciseLogs);
        }
        const exerciseSummaries: ExerciseSummary[] = [...logsByExercise.values()].map(
          (exerciseLogs) => {
            const bestSet = exerciseLogs.reduce((best, current) =>
              current.weightKg > best.weightKg ? current : best,
            );
            const comparison = exerciseComparisonById.get(exerciseLogs[0].exerciseId);
            return {
              exerciseId: exerciseLogs[0].exerciseId,
              exerciseName: exerciseLogs[0].exerciseName,
              setsCompleted: exerciseLogs.length,
              bestSetWeightKg: bestSet.weightKg,
              bestSetReps: bestSet.repsDone,
              isPR: comparison?.isPR ?? false,
              previousBestKg: comparison?.previousBestKg ?? null,
              diffKg: comparison?.diffKg ?? null,
            };
          },
        );

        setSummary({ totalVolumeKg, durationMinutes, exerciseSummaries, setLogs: logs });
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [sessionId, userId, totalVolumeKg, durationMinutes]);

  return { summary, isLoading };
}
