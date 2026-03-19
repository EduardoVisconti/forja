import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HabitScoreCard } from '@/features/habits/components/HabitScoreCard';
import { HabitToggleItem } from '@/features/habits/components/HabitToggleItem';
import { useHabitCheck } from '@/features/habits/hooks/useHabitCheck';
import { HABIT_KEYS } from '@/features/habits/types';

export default function HabitsScreen() {
  const { t } = useTranslation();
  const { habitValues, score, streak, isLoading, toggleHabit } = useHabitCheck();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('habits.title')}</Text>
        <Text style={styles.subtitle}>{t('habits.todaySubtitle')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <HabitScoreCard score={score} streak={streak} />

          <View style={styles.list}>
            {HABIT_KEYS.map((key) => (
              <HabitToggleItem
                key={key}
                habitKey={key}
                checked={habitValues[key]}
                disabled={false}
                onToggle={toggleHabit}
              />
            ))}
          </View>
        </ScrollView>
      )}
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  list: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
