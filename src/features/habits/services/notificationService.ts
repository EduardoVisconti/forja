import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'notifications:daily_reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Cancels any previously scheduled daily reminder (by stored identifier),
 * then schedules a new one at 21:00 every day.
 *
 * Calling this on every app open is safe because the old notification
 * is always cancelled before a new one is created — no duplicates accumulate.
 */
export async function scheduleDailyReminder(title: string, body: string): Promise<void> {
  // 1. Cancel the previous scheduled notification if one exists
  const storedId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId).catch(() => {
      // Ignore errors if the notification no longer exists
    });
  }

  // 2. Schedule a new daily notification at 21:00
  const newId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });

  // 3. Persist the new identifier so we can cancel it next time
  await AsyncStorage.setItem(REMINDER_ID_KEY, newId);
}

export async function cancelDailyReminder(): Promise<void> {
  const storedId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId).catch(() => {});
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  }
}
