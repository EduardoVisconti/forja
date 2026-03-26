import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { CalendarDayVM, CalendarMonthVM } from '../types/historyTypes';

function chunkDays(days: CalendarDayVM[], size: number): CalendarDayVM[][] {
  const chunks: CalendarDayVM[][] = [];
  for (let i = 0; i < days.length; i += size) {
    chunks.push(days.slice(i, i + size));
  }
  return chunks;
}

function formatAriaLabel(day: CalendarDayVM) {
  const parts: string[] = [];
  if (day.dots.workout) parts.push('workout');
  if (day.dots.cardio) parts.push('cardio');
  if (day.dots.habit) parts.push('habit');
  return parts.length > 0 ? `Day ${day.dateISO} (${parts.join(', ')})` : `Day ${day.dateISO}`;
}

interface Props {
  month: CalendarMonthVM;
  selectedDateISO: string | null;
  onSelectDay: (dateISO: string) => void;
}

export function CalendarView({ month, selectedDateISO, onSelectDay }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const rows = useMemo(() => chunkDays(month.days, 7), [month.days]);
  const dots = {
    workout: theme.colors.primary,
    cardio: theme.colors.secondary,
    habit: theme.colors.onSurfaceVariant,
  } as const;

  const weekLabels = [
    t('history.weekdays.mon'),
    t('history.weekdays.tue'),
    t('history.weekdays.wed'),
    t('history.weekdays.thu'),
    t('history.weekdays.fri'),
    t('history.weekdays.sat'),
    t('history.weekdays.sun'),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {weekLabels.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.row}>
          {row.map((day) => {
            const isSelected = selectedDateISO === day.dateISO;
            const isOtherMonth = !day.isInCurrentMonth;
            return (
              <Pressable
                key={day.dateISO}
                style={[
                  styles.cell,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => onSelectDay(day.dateISO)}
                accessibilityRole="button"
                accessibilityLabel={formatAriaLabel(day)}
              >
                <Text style={[styles.dayNumber, isOtherMonth && styles.dayNumberOtherMonth]}>
                  {day.dayNumber}
                </Text>
                <View style={styles.dotsRow}>
                  {day.dots.workout ? <View style={[styles.dot, { backgroundColor: dots.workout }]} /> : null}
                  {day.dots.cardio ? <View style={[styles.dot, { backgroundColor: dots.cardio }]} /> : null}
                  {day.dots.habit ? <View style={[styles.dot, { backgroundColor: dots.habit }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderWidth: 0.5,
      borderColor: '#404040',
    },
    weekHeader: { flexDirection: 'row' },
    weekday: {
      flex: 1,
      fontSize: 12,
      color: '#9ca3af',
      textAlign: 'center',
      marginBottom: 6,
    },
    row: { flexDirection: 'row', paddingVertical: 2 },
    cell: {
      flex: 1,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      marginHorizontal: 1,
      marginVertical: 2,
    },
    cellSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    dayNumber: { fontSize: 14, fontWeight: '700', color: '#d1d5db' },
    dayNumberOtherMonth: { fontWeight: '600', color: '#525252' },
    dotsRow: { flexDirection: 'row', gap: 4, marginTop: 2, height: 10, alignItems: 'center' },
    dot: { width: 7, height: 7, borderRadius: 99 },
  });
