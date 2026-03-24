import AsyncStorage from '@react-native-async-storage/async-storage';

const onboardingCompleteKey = (userId: string) => `onboarding:completed:${userId}`;

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(onboardingCompleteKey(userId));
  return value === '1';
}

export async function setOnboardingComplete(userId: string): Promise<void> {
  await AsyncStorage.setItem(onboardingCompleteKey(userId), '1');
}
