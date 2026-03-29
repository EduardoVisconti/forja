import AsyncStorage from '@react-native-async-storage/async-storage';

const userNameKey = (userId: string) => `user:name:${userId}`;

export async function getStoredUserName(userId: string): Promise<string | null> {
  return AsyncStorage.getItem(userNameKey(userId));
}

export async function setStoredUserName(userId: string, name: string): Promise<void> {
  await AsyncStorage.setItem(userNameKey(userId), name);
}
