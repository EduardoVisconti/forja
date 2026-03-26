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

const WEEK_ACTIVITY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

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

function formatHabitAverage(score: number): string {
  return score.toFixed(1).replace(/\.0$/, '');
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
    error,
    displayName,
    reloadOverview,
    weeklyWorkoutCount,
    weeklyKm,
    weeklyHabitAvg,
  } = useHomeOverview();

  const greetingKey = getGreetingKey(new Date().getHours());
  const motivationalIndex = new Date().getDate() % 10;
  const motivationalPhrase = t(`home.motivational.${motivationalIndex}`);

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

        <Text style={styles.motivationalText}>{motivationalPhrase}</Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('home.weekActivity')}</Text>
            {isOverviewLoading || !weeklyStreak ? (
              <Text style={styles.mutedText}>{t('common.loading')}</Text>
            ) : (
              <View style={styles.weekActivityRow}>
                {weeklyStreak.weekDays.map((day, index) => {
                  const circleStyle = day.isActive
                    ? styles.weekDayCircleActive
                    : day.isToday
                      ? styles.weekDayCircleToday
                      : styles.weekDayCircleInactive;

                  return (
                    <View key={day.dateISO} style={styles.weekDayColumn}>
                      <View style={[styles.weekDayCircle, circleStyle]} />
                      <Text style={styles.weekDayLabel}>{WEEK_ACTIVITY_LABELS[index] ?? ''}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{weeklyWorkoutCount}</Text>
            <Text style={styles.metricLabel}>{t('home.workoutsWeek')}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{weeklyKm.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>{t('home.kmWeek')}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>
              {formatHabitAverage(weeklyHabitAvg.score)}/{weeklyHabitAvg.total}
            </Text>
            <Text style={styles.metricLabel}>{t('home.habitsWeekAvg')}</Text>
          </View>
        </View>

        <WeeklyStreakCard data={weeklyStreak} title={t('common.workoutStreak')} style={styles.card} />

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
    motivationalText: {
      fontSize: 13,
      color: '#525252',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    cardTitle: {
      fontSize: 13,
      color: '#6b6b6b',
      marginBottom: 10,
    },
    weekActivityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    weekDayColumn: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    weekDayCircleActive: {
      backgroundColor: '#ef4444',
      borderWidth: 0,
    },
    weekDayCircleToday: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#ef4444',
    },
    weekDayCircleInactive: {
      backgroundColor: '#1e1e1e',
      borderWidth: 0,
    },
    weekDayLabel: {
      fontSize: 10,
      color: '#525252',
      marginTop: 6,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    metricPill: {
      flex: 1,
      backgroundColor: '#141414',
      borderRadius: 12,
      padding: 10,
    },
    metricValue: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    metricLabel: {
      fontSize: 11,
      color: '#525252',
      marginTop: 2,
    },
    mutedText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      color: theme.colors.primary,
      fontSize: 13,
      paddingHorizontal: 4,
    },
  });
