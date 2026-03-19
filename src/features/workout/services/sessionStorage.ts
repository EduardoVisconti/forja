import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SetLog, WorkoutSession } from '../types/session';

const sessionsKey = (userId: string) => `workout:sessions:${userId}`;
const logsKey = (sessionId: string) => `workout:setlogs:${sessionId}`;

export async function saveSession(session: WorkoutSession): Promise<void> {
  const key = sessionsKey(session.userId);
  const raw = await AsyncStorage.getItem(key);
  const sessions: WorkoutSession[] = raw ? JSON.parse(raw) : [];
  sessions.unshift(session);
  await AsyncStorage.setItem(key, JSON.stringify(sessions));
}

export async function getAllSessions(userId: string): Promise<WorkoutSession[]> {
  const raw = await AsyncStorage.getItem(sessionsKey(userId));
  return raw ? JSON.parse(raw) : [];
}

export async function saveSetLogs(sessionId: string, logs: SetLog[]): Promise<void> {
  await AsyncStorage.setItem(logsKey(sessionId), JSON.stringify(logs));
}

export async function getSetLogs(sessionId: string): Promise<SetLog[]> {
  const raw = await AsyncStorage.getItem(logsKey(sessionId));
  return raw ? JSON.parse(raw) : [];
}

/**
 * Returns all set logs for a specific exercise across all sessions,
 * sorted by completedAt ascending (oldest first).
 */
export async function getAllSetLogsForExercise(
  userId: string,
  exerciseId: string,
): Promise<SetLog[]> {
  const sessions = await getAllSessions(userId);
  const allLogs: SetLog[] = [];

  for (const session of sessions) {
    const logs = await getSetLogs(session.id);
    const exerciseLogs = logs.filter((l) => l.exerciseId === exerciseId);
    allLogs.push(...exerciseLogs);
  }

  return allLogs.sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );
}
