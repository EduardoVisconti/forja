import '@/core/i18n';

import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/auth/authStore';
import {
  requestPermissions,
  scheduleDailyReminder,
} from '@/features/habits/services/notificationService';
import { useSync } from '@/core/sync/useSync';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#16a34a',
    primaryContainer: '#dcfce7',
    onPrimaryContainer: '#14532d',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4ade80',
    primaryContainer: '#14532d',
    onPrimaryContainer: '#dcfce7',
  },
};

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const { setUser, setSession, setInitialized } = useAuthStore();
  const { t } = useTranslation();

  useSync();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      setInitialized(true);
    });

    // Request notification permissions and (re)schedule the daily 9pm reminder.
    // scheduleDailyReminder always cancels the previous identifier before
    // creating a new one, so calling this on every app open is safe.
    requestPermissions().then((granted) => {
      if (granted) {
        scheduleDailyReminder(
          t('habits.notification.title'),
          t('habits.notification.body'),
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [setInitialized, setSession, setUser, t]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </SafeAreaProvider>
  );
}
