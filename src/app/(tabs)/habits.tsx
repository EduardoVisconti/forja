import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HabitConfigModal } from '@/features/habits/components/HabitConfigModal';
import { HabitScoreCard } from '@/features/habits/components/HabitScoreCard';
import { HabitToggleItem } from '@/features/habits/components/HabitToggleItem';
import { useHabitCheck } from '@/features/habits/hooks/useHabitCheck';

function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function HabitsScreen() {
  const { t } = useTranslation();
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const {
    selectedDate,
    isToday,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    habitConfigs,
    allHabitConfigs,
    habitValues,
    score,
    totalActive,
    streak,
    isLoading,
    toggleHabit,
    saveConfig,
  } = useHabitCheck();

  const subtitle = isToday
    ? t('habits.todaySubtitle')
    : t('habits.pastDaySubtitle', { date: formatDDMMYYYY(selectedDate) });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('habits.title')}</Text>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setConfigModalVisible(true)}
          />
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.dateNav}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={goToPreviousDay}
          />
          <Text style={styles.dateText}>{formatDDMMYYYY(selectedDate)}</Text>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={goToNextDay}
            disabled={isToday}
          />
        </View>
        {!isToday && (
          <Button mode="outlined" compact onPress={goToToday} style={styles.todayButton}>
            {t('habits.today')}
          </Button>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <HabitScoreCard score={score} totalActive={totalActive} streak={streak} />

          <View style={styles.list}>
            {habitConfigs.map((habit) => (
              <HabitToggleItem
                key={habit.id}
                habitId={habit.id}
                label={habit.label}
                emoji={habit.emoji}
                checked={habitValues[habit.id] ?? false}
                disabled={!isToday}
                onToggle={toggleHabit}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <HabitConfigModal
        visible={configModalVisible}
        configs={allHabitConfigs}
        onSave={saveConfig}
        onDismiss={() => setConfigModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: { flex: 1, fontSize: 16, textAlign: 'center', color: '#111827' },
  todayButton: { alignSelf: 'center', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  list: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
