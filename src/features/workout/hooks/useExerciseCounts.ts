import { useEffect, useState } from 'react';
import * as storage from '../services/workoutStorage';
import type { WorkoutTemplate } from '../types';

/** Loads exercise counts for all given templates keyed by templateId */
export function useExerciseCounts(
  templates: WorkoutTemplate[],
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (templates.length === 0) return;

    let cancelled = false;

    Promise.all(
      templates.map(async (t) => {
        const exercises = await storage.getExercises(t.id);
        return [t.id, exercises.length] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [templates]);

  return counts;
}
