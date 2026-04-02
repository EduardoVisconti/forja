import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/auth/useAuth';
import { SyncStatusIndicator } from '@/core/sync/SyncStatusIndicator';
import { colors } from '@/core/theme/tokens';
import { WeeklyStreakCard } from '@/features/history/components/WeeklyStreakCard';
import { ProfileModal } from '@/features/home/components/ProfileModal';
import { useHomeOverview } from '@/features/home/hooks/useHomeOverview';
import { useWorkoutSessionStore } from '@/features/workout/store/workoutSessionStore';

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

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { signOut, isLoading } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const workoutSessionId = useWorkoutSessionStore((state) => state.sessionId);
  const workoutTemplateId = useWorkoutSessionStore((state) => state.templateId);
  const workoutTemplateName = useWorkoutSessionStore((state) => state.templateName);
  const workoutCompletedExercises = useWorkoutSessionStore((state) => state.completedExercises);
  const workoutExercises = useWorkoutSessionStore((state) => state.exercises);
  const {
    weeklyStreak,
    todayWorkout,
    todayCardio,
    todayCardioPlan,
    todayHabitsSummary,
    monthlyStats,
    insightType,
    insightMeta,
    error,
    displayName,
    reloadOverview,
  } = useHomeOverview();

  const greetingKey = getGreetingKey(new Date().getHours());
  const motivationalIndex = new Date().getDate() % 10;
  const motivationalPhrase = t(`home.motivational.${motivationalIndex}`);
  const progressWidth = `${Math.min(100, Math.max(0, todayHabitsSummary.progress * 100))}%` as `${number}%`;
  const cardioTitle = todayCardio?.trainingType ? t(`cardio.trainingType.${todayCardio.trainingType}`) : t('cardio.title');
  const cardioZoneLabel = todayCardio?.zone ? t(`cardio.zone.${todayCardio.zone}`) : null;
  const activeSession = workoutSessionId
    ? {
        sessionId: workoutSessionId,
        templateId: workoutTemplateId ?? '',
        templateName: workoutTemplateName,
        completedExercises: Object.keys(workoutCompletedExercises).length,
        totalExercises: workoutExercises.length,
      }
    : null;
  const activeSessionProgress = activeSession && activeSession.totalExercises > 0
    ? (activeSession.completedExercises / activeSession.totalExercises) * 100
    : 0;
  const activeSessionProgressWidth = `${Math.min(100, Math.max(0, activeSessionProgress))}%` as `${number}%`;
  const showContinueWorkoutCard = Boolean(activeSession);
  const showTodayWorkoutCard = !showContinueWorkoutCard && Boolean(todayWorkout);
  const showPlannedCardioCard = Boolean(todayCardioPlan && !todayCardio);
  const showDoneCardioCard = !showPlannedCardioCard && Boolean(todayCardio);
  const hasQuickActions =
    showContinueWorkoutCard || showTodayWorkoutCard || showPlannedCardioCard || showDoneCardioCard;
  const plannedCardioSubtitle = todayCardioPlan
    ? todayCardioPlan.targetDistance !== null
      ? `${todayCardioPlan.targetDistance}km`
      : todayCardioPlan.targetDuration ?? ''
    : '';
  const habitsRemainingText = t(
    insightMeta.remainingHabits > 1 ? 'home.habitsRemainingPlural' : 'home.habitsRemaining',
    { count: insightMeta.remainingHabits },
  );

  const insightText = (() => {
    if (insightType === 'streak') {
      return `🔥 ${insightMeta.streakCount} ${t('home.streakInsight')}`;
    }

    if (insightType === 'habits') {
      return `💪 ${habitsRemainingText}`;
    }

    if (insightType === 'noActivity') {
      return `📅 ${t('home.noWorkoutInsight')}`;
    }

    return motivationalPhrase;
  })();

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
        <View style={styles.greetingHeader}>
          <Text style={styles.greeting}>
            {t(greetingKey)}, {displayName}
          </Text>
          <Text style={styles.subtitle}>{formatTodayDate()}</Text>
        </View>

        <Text style={styles.motivationalText}>{motivationalPhrase}</Text>

        {hasQuickActions ? (
          <View style={styles.todayActivityStack}>
            {showContinueWorkoutCard && activeSession ? (
              <Card style={[styles.card, styles.todayWorkoutCard]}>
                <Card.Content>
                  <Text style={styles.cardTitle}>{t('home.sessionInProgress')}</Text>
                  <Text style={styles.activityPrimary}>{activeSession.templateName}</Text>
                  <Text style={styles.activitySecondary}>
                    {t('home.exercisesProgress', {
                      completed: activeSession.completedExercises,
                      total: activeSession.totalExercises,
                    })}
                  </Text>
                  <View style={styles.workoutProgressTrack}>
                    <View style={[styles.workoutProgressFill, { width: activeSessionProgressWidth }]} />
                  </View>
                  <Button
                    mode="contained"
                    compact
                    buttonColor={colors.workout}
                    textColor="#ffffff"
                    style={styles.quickActionButton}
                    onPress={() => router.push(`/workout/${activeSession.templateId}` as never)}
                    disabled={!activeSession.templateId}
                  >
                    {t('home.continueWorkout')}
                  </Button>
                </Card.Content>
              </Card>
            ) : null}

            {showTodayWorkoutCard && todayWorkout ? (
              <Card
                style={[
                  styles.card,
                  styles.todayWorkoutCard,
                ]}
              >
                <Card.Content>
                  <Text style={styles.cardTitle}>{t('home.todayWorkout')}</Text>
                  <Text style={styles.activityPrimary}>{todayWorkout.templateName}</Text>
                  {todayWorkout.durationMinutes > 0 ? (
                    <Text style={styles.activitySecondary}>
                      {todayWorkout.durationMinutes} {t('summary.minutes')}
                    </Text>
                  ) : null}
                </Card.Content>
              </Card>
            ) : null}

            {showPlannedCardioCard && todayCardioPlan ? (
              <Card style={[styles.card, styles.todayCardioCard]}>
                <Card.Content>
                  <Text style={styles.cardTitle}>{t('home.cardioPlannedToday')}</Text>
                  <Text style={styles.activityPrimary}>{todayCardioPlan.title}</Text>
                  {plannedCardioSubtitle ? (
                    <Text style={styles.activitySecondary}>{plannedCardioSubtitle}</Text>
                  ) : null}
                  <Button
                    mode="outlined"
                    compact
                    style={styles.quickActionButton}
                    onPress={() => router.push(`/cardio/complete/${todayCardioPlan.planId}` as never)}
                  >
                    {t('home.registerAsDone')}
                  </Button>
                </Card.Content>
              </Card>
            ) : null}

            {showDoneCardioCard && todayCardio ? (
              <Card
                style={[
                  styles.card,
                  styles.todayCardioCard,
                ]}
              >
                <Card.Content>
                  <Text style={styles.cardTitle}>{t('home.todayCardio')}</Text>
                  <Text style={styles.activityPrimary}>
                    {cardioTitle}
                    {cardioZoneLabel ? ` • ${cardioZoneLabel}` : ''}
                  </Text>
                  <Text style={styles.activitySecondary}>
                    {todayCardio.distanceKm.toFixed(1)} {t('home.monthKm')}
                  </Text>
                </Card.Content>
              </Card>
            ) : null}
          </View>
        ) : (
          <Text style={styles.noActivityText}>{t('home.noActivityToday')}</Text>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('home.habitsToday')}</Text>
            <Text style={styles.habitScoreValue}>
              {todayHabitsSummary.score}/{todayHabitsSummary.totalActive}
            </Text>
            <View style={styles.habitProgressTrack}>
              <View style={[styles.habitProgressFill, { width: progressWidth }]} />
            </View>
            {todayHabitsSummary.isComplete ? (
              <Text style={styles.habitInsightDone}>{t('home.allHabitsDone')}</Text>
            ) : todayHabitsSummary.totalActive > 0 ? (
              <Text style={styles.habitInsightPending}>{habitsRemainingText}</Text>
            ) : null}
          </Card.Content>
        </Card>

        <WeeklyStreakCard data={weeklyStreak} style={styles.weeklyCard} />

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('home.thisMonth')}</Text>
            <View style={styles.monthlyRow}>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyValue}>{monthlyStats.workoutCount}</Text>
                <Text style={styles.monthlyLabel}>{t('home.monthWorkouts')}</Text>
              </View>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyValue}>{monthlyStats.totalKm.toFixed(1)}</Text>
                <Text style={styles.monthlyLabel}>{t('home.monthKm')}</Text>
              </View>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyValue}>{monthlyStats.habitPercentage}%</Text>
                <Text style={styles.monthlyLabel}>{t('home.monthHabits')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.insightCard}>
          <Text style={styles.insightText}>{insightText}</Text>
        </View>

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
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
    },
    greetingHeader: {
      paddingVertical: 8,
    },
    motivationalText: {
      fontSize: 13,
      color: '#9ca3af',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    cardTitle: {
      fontSize: 13,
      color: '#9ca3af',
      marginBottom: 10,
    },
    todayActivityStack: {
      gap: 8,
    },
    todayWorkoutCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.workout,
    },
    todayCardioCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.cardio,
    },
    workoutProgressTrack: {
      width: '100%',
      height: 4,
      borderRadius: 99,
      backgroundColor: '#262626',
      overflow: 'hidden',
      marginTop: 8,
      marginBottom: 10,
    },
    workoutProgressFill: {
      height: '100%',
      borderRadius: 99,
      backgroundColor: colors.complete,
    },
    quickActionButton: {
      alignSelf: 'flex-start',
    },
    activityPrimary: {
      fontSize: 16,
      fontWeight: '700',
      color: '#f3f4f6',
    },
    activitySecondary: {
      fontSize: 12,
      color: '#9ca3af',
      marginTop: 6,
    },
    habitScoreValue: {
      fontSize: 28,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 8,
    },
    habitProgressTrack: {
      width: '100%',
      height: 4,
      borderRadius: 99,
      backgroundColor: '#262626',
      overflow: 'hidden',
      marginBottom: 8,
    },
    habitProgressFill: {
      height: '100%',
      borderRadius: 99,
      backgroundColor: colors.complete,
    },
    habitInsightPending: {
      color: colors.textMuted,
      fontSize: 12,
    },
    habitInsightDone: {
      color: colors.complete,
      fontSize: 12,
    },
    weeklyCard: {
      marginHorizontal: 0,
      marginTop: 0,
    },
    monthlyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    monthlyStat: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    monthlyValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    monthlyLabel: {
      marginTop: 4,
      fontSize: 11,
      color: colors.textMuted,
    },
    noActivityText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    insightCard: {
      backgroundColor: '#1a1a1a',
      borderLeftWidth: 3,
      borderLeftColor: colors.workout,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    insightText: {
      fontSize: 13,
      color: '#d1d5db',
    },
    errorText: {
      color: theme.colors.primary,
      fontSize: 13,
      paddingHorizontal: 4,
    },
  });
