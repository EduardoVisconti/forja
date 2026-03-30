import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { triggerSync } from '@/core/sync/syncStore';
import * as legacyStorage from '../services/cardioStorage';
import * as storage from '../services/cardioPlanStorage';
import type { CardioType, CardioZone } from '../types';
import type { CardioRecord } from '../types/plans';

type CreateRecordData = Omit<CardioRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
type UpdateRecordData = Partial<
  Omit<CardioRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

const LEGACY_TRAINING_TYPES = new Set(['regenerative', 'intervals', 'long', 'walk', 'strong']);
const LEGACY_ZONES = new Set(['z1', 'z2', 'z3', 'z4', 'z5']);

function toLegacyTrainingType(value: string | null): CardioType {
  if (!value || !LEGACY_TRAINING_TYPES.has(value)) return null;
  return value as Exclude<CardioType, null>;
}

function toLegacyZone(value: string | null): CardioZone {
  if (!value || !LEGACY_ZONES.has(value)) return null;
  return value as Exclude<CardioZone, null>;
}

async function mirrorRecordUpsertToLegacy(userId: string, record: CardioRecord): Promise<void> {
  const logs = await legacyStorage.getLogs(userId);
  const nextLog = {
    id: record.id,
    userId: record.userId,
    date: record.performedAt,
    trainingType: toLegacyTrainingType(record.trainingType),
    zone: toLegacyZone(record.zone),
    duration: record.duration ?? '',
    distanceKm: record.distanceKm ?? 0,
    avgPace: record.avgPace ?? '',
    avgHr: record.avgHr,
    notes: record.notes ?? '',
    createdAt: record.createdAt,
  };

  const exists = logs.some((log) => log.id === record.id);
  const merged = exists
    ? logs.map((log) => (log.id === record.id ? nextLog : log))
    : [nextLog, ...logs];
  await legacyStorage.saveLogs(userId, merged);
}

async function mirrorRecordDeleteFromLegacy(userId: string, id: string): Promise<void> {
  const logs = await legacyStorage.getLogs(userId);
  await legacyStorage.saveLogs(
    userId,
    logs.filter((log) => log.id !== id),
  );
}

export function useCardioRecords() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [records, setRecords] = useState<CardioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRecords([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await storage.getRecords(userId);
      setRecords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
    [records],
  );

  const createRecord = useCallback(
    async (data: CreateRecordData) => {
      const record = await storage.createRecord(userId, data);
      await mirrorRecordUpsertToLegacy(userId, record);
      setRecords((prev) => [record, ...prev]);
      triggerSync();
      return record;
    },
    [userId],
  );

  const updateRecord = useCallback(
    async (id: string, data: UpdateRecordData) => {
      await storage.updateRecord(userId, id, data);
      const latest = await storage.getRecords(userId);
      setRecords(latest);
      const updatedRecord = latest.find((record) => record.id === id);
      if (updatedRecord) {
        await mirrorRecordUpsertToLegacy(userId, updatedRecord);
      }
      triggerSync();
    },
    [userId],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      await storage.deleteRecord(userId, id);
      await mirrorRecordDeleteFromLegacy(userId, id);
      setRecords((prev) => prev.filter((record) => record.id !== id));
      triggerSync();
    },
    [userId],
  );

  return {
    records: sortedRecords,
    isLoading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    reload: load,
  };
}
