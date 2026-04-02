import { useEffect, useState } from 'react';
import {
  loadPersistedSession,
  useWorkoutSessionStore,
} from '../store/workoutSessionStore';

export function useSessionRecovery() {
  const [checked, setChecked] = useState(false);
  const sessionId = useWorkoutSessionStore((state) => state.sessionId);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (sessionId) {
        if (!cancelled) setChecked(true);
        return;
      }

      const saved = await loadPersistedSession();
      if (cancelled) return;

      if (saved?.sessionId) {
        useWorkoutSessionStore.setState({
          ...saved,
          restSecondsRemaining: null,
          timerRunning: false,
          nextExercise: null,
        });
      }

      setChecked(true);
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return { checked };
}
