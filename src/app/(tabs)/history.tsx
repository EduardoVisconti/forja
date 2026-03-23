import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
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
  const {
    isLoading,
    error,
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
        <Text style={styles.title}>{t('tabs.history')}</Text>
        <View style={styles.monthNav}>
          <IconButton icon="chevron-left" size={24} onPress={goToPreviousMonth} />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <IconButton icon="chevron-right" size={24} onPress={goToNextMonth} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  monthNav: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111827' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
  loadingText: { color: '#6b7280' },
  errorText: { color: '#ef4444', textAlign: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
});
