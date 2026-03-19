import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardioLog } from '../types';

const logsKey = (userId: string) => `cardio:logs:${userId}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getLogs(userId: string): Promise<CardioLog[]> {
  const raw = await AsyncStorage.getItem(logsKey(userId));
  return raw ? (JSON.parse(raw) as CardioLog[]) : [];
}

async function saveLogs(userId: string, logs: CardioLog[]): Promise<void> {
  await AsyncStorage.setItem(logsKey(userId), JSON.stringify(logs));
}

export async function createLog(
  userId: string,
  data: Omit<CardioLog, 'id' | 'userId' | 'createdAt'>,
): Promise<CardioLog> {
  const logs = await getLogs(userId);
  const log: CardioLog = {
    ...data,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString(),
  };
  // Most recent first
  await saveLogs(userId, [log, ...logs]);
  return log;
}

export async function updateLog(
  userId: string,
  id: string,
  data: Partial<Omit<CardioLog, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  const logs = await getLogs(userId);
  const updated = logs.map((l) => (l.id === id ? { ...l, ...data } : l));
  await saveLogs(userId, updated);
}

export async function deleteLog(userId: string, id: string): Promise<void> {
  const logs = await getLogs(userId);
  await saveLogs(userId, logs.filter((l) => l.id !== id));
}
