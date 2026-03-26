import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const {
    selectedDate,
    isToday,
    canGoBack,
    isEditable,
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
    error,
    toggleHabit,
    reload,
    saveConfig,
  } = useHabitCheck();

  const subtitle = isToday
    ? t('habits.todaySubtitle')
    : t('habits.pastDaySubtitle', { date: formatDDMMYYYY(selectedDate) });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topControls}>
        <View style={styles.settingsRow}>
          <IconButton icon="cog" size={24} onPress={() => setConfigModalVisible(true)} />
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.dateNav}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={goToPreviousDay}
            disabled={!canGoBack}
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('habits.loadError')}</Text>
          <Button mode="contained-tonal" onPress={reload}>
            {t('common.retry')}
          </Button>
        </View>
      ) : habitConfigs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text style={styles.emptyText}>{t('habits.emptyHint')}</Text>
          <Button mode="contained" onPress={() => setConfigModalVisible(true)}>
            {t('habits.emptyAction')}
          </Button>
        </View>
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
                disabled={!isEditable}
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

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topControls: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    subtitle: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    dateText: { flex: 1, fontSize: 16, textAlign: 'center', color: theme.colors.onSurface },
    todayButton: { alignSelf: 'center', marginTop: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 30, marginBottom: 8 },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 12,
      paddingHorizontal: 24,
    },
    errorText: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 12,
      paddingHorizontal: 24,
    },
    scroll: { flexGrow: 1, paddingBottom: 40 },
    list: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
  });
