import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/auth/useAuth';
import { SyncStatusIndicator } from '@/core/sync/SyncStatusIndicator';
import { WeeklyStreakCard } from '@/features/history/components/WeeklyStreakCard';
import { ProfileModal } from '@/features/home/components/ProfileModal';
import { useHomeOverview } from '@/features/home/hooks/useHomeOverview';

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTodayDate(): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return capitalize(formatted.replace('-feira', ''));
}

function getGreetingKey(hour: number): 'home.goodMorning' | 'home.goodAfternoon' | 'home.goodEvening' {
  if (hour >= 5 && hour < 12) return 'home.goodMorning';
  if (hour >= 12 && hour < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

function formatWorkoutDateLabel(finishedAtISO: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const now = new Date();
  const finishedAt = new Date(finishedAtISO);
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfFinished = new Date(
    finishedAt.getFullYear(),
    finishedAt.getMonth(),
    finishedAt.getDate(),
  );
  const diffInDays = Math.floor(
    (startOfNow.getTime() - startOfFinished.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays <= 0) return t('home.today');
  if (diffInDays === 1) return t('home.yesterday');
  if (diffInDays <= 7) return t('home.daysAgo', { count: diffInDays });

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(finishedAt);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { signOut, isLoading } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const {
    isLoading: isOverviewLoading,
    weeklyStreak,
    lastWorkout,
    todayHabits,
    error,
    displayName,
    reloadOverview,
  } =
    useHomeOverview();
  const greetingKey = getGreetingKey(new Date().getHours());
  const habitsTotal = todayHabits?.totalActive ?? 0;
  const habitsScore = todayHabits?.score ?? 0;
  const hasCheckedHabits = habitsScore > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerRight}>
          <SyncStatusIndicator />
          <IconButton
            icon={({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />}
            size={22}
            onPress={() => setProfileVisible(true)}
            accessibilityLabel={t('home.profile.open')}
          />
          <IconButton
            icon="logout-variant"
            size={20}
            onPress={signOut}
            disabled={isLoading}
            accessibilityLabel={t('home.signOut')}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.greeting}>
              {t(greetingKey)}, {displayName}
            </Text>
            <Text style={styles.subtitle}>{formatTodayDate()}</Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomRow}>
          <Card style={[styles.card, styles.halfCard]}>
            <Card.Content>
              <Text style={styles.cardTitle}>{t('home.lastWorkout')}</Text>
              {isOverviewLoading ? (
                <Text style={styles.mutedText}>{t('common.loading')}</Text>
              ) : lastWorkout ? (
                <>
                  <Text style={styles.templateNameText}>{lastWorkout.templateName}</Text>
                  <Text style={styles.mutedText}>
                    {formatWorkoutDateLabel(lastWorkout.finishedAt, t)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryText}>{t('home.noWorkoutYet')}</Text>
                  <Text style={styles.mutedText}>{t('home.noWorkoutHint')}</Text>
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.halfCard]}>
            <Card.Content>
              <Text style={styles.cardTitle}>{t('home.habitsToday')}</Text>
              {isOverviewLoading ? (
                <Text style={styles.mutedText}>{t('common.loading')}</Text>
              ) : todayHabits ? (
                <>
                  <Text style={styles.habitsScoreText}>
                    {t('home.habitsScore', { score: habitsScore, total: habitsTotal })}
                  </Text>
                  {!hasCheckedHabits ? (
                    <Text style={styles.secondarySmall}>Vamos lá?</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.mutedText}>{t('home.habitsNotChecked')}</Text>
                  <Text style={styles.secondarySmall}>Vamos lá?</Text>
                </>
              )}
            </Card.Content>
          </Card>
        </View>

        <WeeklyStreakCard data={weeklyStreak} title={t('home.weekStreak')} style={styles.card} />

        {error ? <Text style={styles.errorText}>{t('common.error')}</Text> : null}
      </ScrollView>

      <ProfileModal
        visible={profileVisible}
        onDismiss={() => setProfileVisible(false)}
        onNameUpdated={reloadOverview}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    logo: {
      width: 32,
      height: 32,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      margin: 0,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    bottomRow: {
      flexDirection: 'row',
      gap: 12,
    },
    halfCard: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    greeting: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
    },
    primaryText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    templateNameText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },
    habitsScoreText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ef4444',
    },
    mutedText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    secondarySmall: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    errorText: {
      color: theme.colors.primary,
      fontSize: 13,
      paddingHorizontal: 4,
    },
  });
