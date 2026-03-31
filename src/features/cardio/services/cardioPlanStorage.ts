import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordDeletion } from '@/features/sync/services/deletedRecordsStorage';
import type { CardioPlan, CardioRecord, PlanStatus } from '../types/plans';

const plansKey = (userId: string) => `cardio:plans:${userId}`;
const recordsKey = (userId: string) => `cardio:records:${userId}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

type CreatePlanInput = Omit<
  CardioPlan,
  'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt' | 'completedAt' | 'completedRecordId'
> & {
  status?: PlanStatus;
};

type UpdatePlanInput = Partial<
  Omit<CardioPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

type CreateRecordInput = Omit<CardioRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
type UpdateRecordInput = Partial<
  Omit<CardioRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export async function getPlans(userId: string): Promise<CardioPlan[]> {
  const raw = await AsyncStorage.getItem(plansKey(userId));
  const parsed = raw ? (JSON.parse(raw) as CardioPlan[]) : [];
  return parsed.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
}

export async function savePlans(userId: string, plans: CardioPlan[]): Promise<void> {
  await AsyncStorage.setItem(plansKey(userId), JSON.stringify(plans));
}

export async function createPlan(userId: string, data: CreatePlanInput): Promise<CardioPlan> {
  const plans = await getPlans(userId);
  const now = nowISO();
  const plan: CardioPlan = {
    id: generateId(),
    userId,
    activityType: data.activityType,
    title: data.title,
    trainingType: data.trainingType ?? null,
    plannedDate: data.plannedDate,
    targetDistance: data.targetDistance ?? null,
    targetDuration: data.targetDuration ?? null,
    targetZone: data.targetZone ?? null,
    targetPace: data.targetPace ?? null,
    notes: data.notes ?? null,
    status: data.status ?? 'pending',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    completedRecordId: null,
  };

  await savePlans(userId, [...plans, plan]);
  return plan;
}

export async function updatePlan(userId: string, id: string, data: UpdatePlanInput): Promise<void> {
  const plans = await getPlans(userId);
  const updated = plans.map((plan) =>
    plan.id === id
      ? {
          ...plan,
          ...data,
          updatedAt: nowISO(),
        }
      : plan,
  );
  await savePlans(userId, updated);
}

export async function deletePlan(userId: string, id: string): Promise<void> {
  await recordDeletion(userId, id, 'cardio_plans');
  const plans = await getPlans(userId);
  await savePlans(
    userId,
    plans.filter((plan) => plan.id !== id),
  );
}

export async function getRecords(userId: string): Promise<CardioRecord[]> {
  const raw = await AsyncStorage.getItem(recordsKey(userId));
  const parsed = raw ? (JSON.parse(raw) as CardioRecord[]) : [];
  return parsed.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

export async function saveRecords(userId: string, records: CardioRecord[]): Promise<void> {
  await AsyncStorage.setItem(recordsKey(userId), JSON.stringify(records));
}

export async function createRecord(userId: string, data: CreateRecordInput): Promise<CardioRecord> {
  const records = await getRecords(userId);
  const now = nowISO();
  const record: CardioRecord = {
    id: generateId(),
    userId,
    planId: data.planId ?? null,
    activityType: data.activityType,
    trainingType: data.trainingType ?? null,
    performedAt: data.performedAt,
    duration: data.duration ?? null,
    distanceKm: data.distanceKm ?? null,
    avgPace: data.avgPace ?? null,
    avgHr: data.avgHr ?? null,
    zone: data.zone ?? null,
    notes: data.notes ?? null,
    perceivedEffort: data.perceivedEffort ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await saveRecords(userId, [record, ...records]);
  return record;
}

export async function updateRecord(
  userId: string,
  id: string,
  data: UpdateRecordInput,
): Promise<void> {
  const records = await getRecords(userId);
  const updated = records.map((record) =>
    record.id === id
      ? {
          ...record,
          ...data,
          updatedAt: nowISO(),
        }
      : record,
  );
  await saveRecords(userId, updated);
}

export async function deleteRecord(userId: string, id: string): Promise<void> {
  await recordDeletion(userId, id, 'cardio_records');

  const records = await getRecords(userId);
  const record = records.find((item) => item.id === id);

  await saveRecords(
    userId,
    records.filter((item) => item.id !== id),
  );

  // If this record completed a plan, revert the plan to pending.
  if (record?.planId) {
    const plans = await getPlans(userId);
    const updatedPlans = plans.map((plan) =>
      plan.id === record.planId
        ? {
            ...plan,
            status: 'pending' as const,
            completedAt: null,
            completedRecordId: null,
            updatedAt: nowISO(),
          }
        : plan,
    );

    await savePlans(userId, updatedPlans);
  }
}

export async function migrateCardioLogsToRecords(userId: string): Promise<void> {
  const migratedKey = `cardio:migrated:${userId}`;
  const alreadyMigrated = await AsyncStorage.getItem(migratedKey);
  if (alreadyMigrated) return;

  // Read legacy logs
  const logsRaw = await AsyncStorage.getItem(`cardio:logs:${userId}`);
  if (!logsRaw) {
    await AsyncStorage.setItem(migratedKey, 'true');
    return;
  }

  const logs = JSON.parse(logsRaw);
  const records = await getRecords(userId);
  const existingIds = new Set(records.map((r) => r.id));

  const migrated = logs
    .filter((log: any) => !existingIds.has(log.id))
    .map((log: any) => ({
      id: log.id,
      userId: log.userId,
      planId: null,
      activityType: 'running' as const,
      trainingType: log.trainingType ?? null,
      performedAt: log.date,
      duration: log.duration ?? null,
      distanceKm: log.distanceKm ?? null,
      avgPace: log.avgPace ?? null,
      avgHr: log.avgHr ?? null,
      zone: log.zone ?? null,
      notes: log.notes ?? null,
      perceivedEffort: null,
      createdAt: log.createdAt,
      updatedAt: log.createdAt,
    }));

  if (migrated.length > 0) {
    await saveRecords(userId, [...records, ...migrated]);
  }

  await AsyncStorage.setItem(migratedKey, 'true');
}
