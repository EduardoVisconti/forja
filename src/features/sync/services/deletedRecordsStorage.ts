import AsyncStorage from '@react-native-async-storage/async-storage';

type DeletedRecord = {
  id: string;
  tableName: string;
  deletedAt: string;
};

const key = (userId: string) => `deleted_records:${userId}`;

export async function recordDeletion(
  userId: string,
  id: string,
  tableName: string,
): Promise<void> {
  const raw = await AsyncStorage.getItem(key(userId));
  const records = (raw ? JSON.parse(raw) : []) as DeletedRecord[];

  const alreadyExists = records.some((record: { id: string }) => record.id === id);
  if (alreadyExists) return;

  records.push({ id, tableName, deletedAt: new Date().toISOString() });
  await AsyncStorage.setItem(key(userId), JSON.stringify(records));
}

export async function wasDeleted(userId: string, id: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return false;
  const records = JSON.parse(raw) as Array<{ id: string }>;
  return records.some((record) => record.id === id);
}

export async function getDeletedRecords(userId: string): Promise<DeletedRecord[]> {
  const raw = await AsyncStorage.getItem(key(userId));
  return raw ? (JSON.parse(raw) as DeletedRecord[]) : [];
}
