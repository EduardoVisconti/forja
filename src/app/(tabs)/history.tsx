import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CalendarView } from '@/features/history/components/CalendarView';
import { DaySummaryDialog } from '@/features/history/components/DaySummaryDialog';
import { WeeklyStreakCard } from '@/features/history/components/WeeklyStreakCard';
import { WeeklyHabitScoreLineChart } from '@/features/history/components/WeeklyHabitScoreLineChart';
import { PrExerciseList } from '@/features/history/components/PrExerciseList';
import { ExerciseWeightProgressionDialog } from '@/features/history/components/ExerciseWeightProgressionDialog';
import { useHistoryProgress } from '@/features/history/hooks/useHistoryProgress';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const {
    isLoading,
    calendarMonth,
    goToPreviousMonth,
    goToNextMonth,
    onSelectDay,
    selectedDayISO,
    dayDialogVisible,
    daySummary,
    closeDayDialog,
    weeklyStreak,
    weeklyHabitScore,
    prExercises,
    exerciseDialogVisible,
    selectedExercise,
    closeExerciseDialog,
    openExerciseDialog,
  } = useHistoryProgress();

  const monthLabel = useMemo(() => {
    const mm = calendarMonth.monthIndex + 1;
    const year = calendarMonth.year;
    return `${String(mm).padStart(2, '0')}/${year}`;
  }, [calendarMonth.monthIndex, calendarMonth.year]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history.screenTitle')}</Text>
        <Text style={styles.subtitle}>{t('history.screenSubtitle')}</Text>
      </View>

      <View style={styles.topControls}>
        <View style={styles.monthNav}>
          <IconButton
            icon="chevron-left"
            size={20}
            onPress={goToPreviousMonth}
            style={styles.monthNavIconButton}
          />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <IconButton
            icon="chevron-right"
            size={20}
            onPress={goToNextMonth}
            style={styles.monthNavIconButton}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <CalendarView
            month={calendarMonth}
            selectedDateISO={selectedDayISO}
            onSelectDay={onSelectDay}
          />

          <DaySummaryDialog visible={dayDialogVisible} summary={daySummary} onDismiss={closeDayDialog} />

          <WeeklyStreakCard data={weeklyStreak} />
          <WeeklyHabitScoreLineChart data={weeklyHabitScore} />

          <PrExerciseList exercises={prExercises} onPressExercise={openExerciseDialog} />

          <ExerciseWeightProgressionDialog
            visible={exerciseDialogVisible}
            exercise={selectedExercise}
            onDismiss={closeExerciseDialog}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    subtitle: {
      fontSize: 13,
      color: '#525252',
      marginTop: 2,
    },
    topControls: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    monthNav: { flexDirection: 'row', alignItems: 'center' },
    monthNavIconButton: { margin: 0 },
    monthLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
    loadingText: { color: theme.colors.onSurfaceVariant },
    scroll: { flexGrow: 1, paddingBottom: 40 },
  });
