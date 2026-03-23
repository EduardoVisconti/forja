import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WeeklyStreakVM } from '../types/historyTypes';

interface Props {
  data: WeeklyStreakVM | null;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyStreakCard({ data }: Props) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>{t('common.loading')}</Text>
        </Card.Content>
      </Card>
    );
  }

  const countStyle = data.currentWeekHasActiveDay ? styles.countActive : styles.countDimmed;

  return (
    <Card style={styles.card}>
      <Card.Title title={t('history.weekStreak')} />
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.flame}>🔥</Text>
          <View style={styles.countBlock}>
            <Text style={[styles.count, countStyle]}>{data.streakCount}</Text>
            <Text style={styles.label}>{t('history.weeks')}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.weekLabels}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.dotsRow}>
            {data.weekDays.map((day) => (
              <View
                key={day.dateISO}
                style={[
                  styles.dot,
                  day.isActive && styles.dotFilled,
                  day.isToday && styles.dotToday,
                ]}
              />
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flame: {
    fontSize: 28,
  },
  countBlock: {
    alignItems: 'center',
  },
  count: {
    fontSize: 24,
    fontWeight: '700',
  },
  countActive: {
    color: '#111827',
  },
  countDimmed: {
    color: '#9ca3af',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  right: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 6,
  },
  weekLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 4,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  dotFilled: {
    backgroundColor: '#22c55e',
  },
  dotToday: {
    borderWidth: 2,
    borderColor: '#111827',
  },
});
