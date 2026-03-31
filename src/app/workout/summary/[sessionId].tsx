import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/core/auth/authStore';
import { SessionSummaryCard } from '@/features/workout/components/SessionSummaryCard';
import { useSessionSummary } from '@/features/workout/hooks/useSessionSummary';
import { useUserPreferences } from '@/features/workout/hooks/useUserPreferences';
import { getAllSessions } from '@/features/workout/services/sessionStorage';
import { useEffect, useState } from 'react';
import type { WorkoutSession } from '@/features/workout/types/session';

export default function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { unit } = useUserPreferences();
  const [sessionMeta, setSessionMeta] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    getAllSessions(userId).then((sessions) => {
      const found = sessions.find((s) => s.id === sessionId) ?? null;
      setSessionMeta(found);
    });
  }, [sessionId, userId]);

  const { summary, isLoading } = useSessionSummary(
    sessionId ?? '',
    userId,
    sessionMeta?.totalVolumeKg ?? 0,
    sessionMeta?.durationMinutes ?? 0,
  );
  const screenOptions = {
    title: '',
    headerStyle: { backgroundColor: '#0a0a0a' },
    headerTintColor: '#ffffff',
  } as const;

  if (isLoading || !summary) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={screenOptions} />
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={screenOptions} />
      <ScrollView contentContainerStyle={styles.container}>
        <SessionSummaryCard summary={summary} unit={unit} />
        <Button
          mode="contained"
          onPress={() => router.replace('/(tabs)/workout' as never)}
          style={styles.button}
        >
          {t('summary.backToWorkouts')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: { flexGrow: 1, padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  button: { marginTop: 8 },
});
