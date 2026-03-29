import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardioLog, CardioType, CardioZone } from '../types';

const logsKey = (userId: string) => `cardio:logs:${userId}`;

const TRAINING_TYPE_VALUES = new Set(['regenerative', 'intervals', 'long', 'walk']);
const ZONE_VALUES = new Set(['z1', 'z2', 'z3', 'z4', 'z5']);

interface LegacyCardioLog extends Omit<CardioLog, 'trainingType' | 'zone' | 'duration'> {
  category?: string;
  trainingType?: CardioType;
  zone?: CardioZone;
  duration?: string;
  durationMinutes?: number;
}

function formatLegacyDuration(duration: string | undefined, durationMinutes: number | undefined): string {
  if (typeof duration === 'string' && duration.trim().length > 0) {
    return duration.trim();
  }

  if (!Number.isFinite(durationMinutes)) {
    return '';
  }

  const totalSeconds = Math.max(0, Math.round((durationMinutes ?? 0) * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  if (seconds === 0) {
    return String(minutes);
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function migrateLog(raw: LegacyCardioLog): CardioLog {
  const migratedDuration = formatLegacyDuration(raw.duration, raw.durationMinutes);
  if ('trainingType' in raw && 'zone' in raw && !('category' in raw) && 'duration' in raw) {
    return { ...raw, duration: migratedDuration } as CardioLog;
  }

  const { category, ...rest } = raw;
  const trainingType = (category && TRAINING_TYPE_VALUES.has(category) ? category : null) as CardioType;
  const zone = (category && ZONE_VALUES.has(category) ? category : null) as CardioZone;

  return { ...rest, duration: migratedDuration, trainingType, zone };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getLogs(userId: string): Promise<CardioLog[]> {
  const raw = await AsyncStorage.getItem(logsKey(userId));
  const parsed: LegacyCardioLog[] = raw ? JSON.parse(raw) : [];
  const logs = parsed.map(migrateLog);
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveLogs(userId: string, logs: CardioLog[]): Promise<void> {
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
