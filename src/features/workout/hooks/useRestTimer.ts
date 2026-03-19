import { useEffect } from 'react';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';

export function useRestTimer() {
  const timerRunning = useWorkoutSessionStore((s) => s.timerRunning);
  const restSecondsRemaining = useWorkoutSessionStore((s) => s.restSecondsRemaining);
  const tickRestTimer = useWorkoutSessionStore((s) => s.tickRestTimer);
  const skipRestTimer = useWorkoutSessionStore((s) => s.skipRestTimer);
  const addRestTime = useWorkoutSessionStore((s) => s.addRestTime);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickRestTimer]);

  return {
    restSecondsRemaining,
    timerRunning,
    skipRestTimer,
    addThirtySeconds: () => addRestTime(30),
  };
}
