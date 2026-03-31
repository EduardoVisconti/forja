import { useEffect, useState } from 'react';
import { getAllSetLogsForExercise, getSetLogs } from '../services/sessionStorage';
import type { SetLog } from '../types/session';

export interface PR {
  exerciseName: string;
  weightKg: number;
}

export interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  bestSetWeightKg: number;
  bestSetReps: number;
  isPR: boolean;
}

export interface SessionSummary {
  totalVolumeKg: number;
  durationMinutes: number;
  prs: PR[];
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
        const prs: PR[] = [];

        for (const exerciseId of exerciseIds) {
          const allLogs = await getAllSetLogsForExercise(userId, exerciseId);
          const sessionLogs = allLogs.filter((l) => l.sessionId === sessionId);
          const previousLogs = allLogs.filter((l) => l.sessionId !== sessionId);

          if (sessionLogs.length === 0) continue;

          const maxCurrentWeight = Math.max(...sessionLogs.map((l) => l.weightKg));
          const maxPreviousWeight =
            previousLogs.length > 0 ? Math.max(...previousLogs.map((l) => l.weightKg)) : 0;

          if (maxCurrentWeight > maxPreviousWeight) {
            prs.push({
              exerciseName: sessionLogs[0].exerciseName,
              weightKg: maxCurrentWeight,
            });
          }
        }

        const logsByExercise = new Map<string, SetLog[]>();
        for (const log of logs) {
          const exerciseLogs = logsByExercise.get(log.exerciseName) ?? [];
          exerciseLogs.push(log);
          logsByExercise.set(log.exerciseName, exerciseLogs);
        }

        const prExerciseNames = new Set(prs.map((pr) => pr.exerciseName));
        const exerciseSummaries: ExerciseSummary[] = [...logsByExercise.values()].map(
          (exerciseLogs) => {
            const bestSet = exerciseLogs.reduce((best, current) =>
              current.weightKg > best.weightKg ? current : best,
            );
            return {
              exerciseId: exerciseLogs[0].exerciseId,
              exerciseName: exerciseLogs[0].exerciseName,
              setsCompleted: exerciseLogs.length,
              bestSetWeightKg: bestSet.weightKg,
              bestSetReps: bestSet.repsDone,
              isPR: prExerciseNames.has(exerciseLogs[0].exerciseName),
            };
          },
        );

        setSummary({ totalVolumeKg, durationMinutes, prs, exerciseSummaries, setLogs: logs });
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [sessionId, userId, totalVolumeKg, durationMinutes]);

  return { summary, isLoading };
}
