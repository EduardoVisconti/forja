import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WeeklyStreakVM } from '../types/historyTypes';

interface Props {
  data: WeeklyStreakVM | null;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyStreakCard({ data, title, style }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!data) {
    return (
      <Card style={[styles.card, style]}>
        <Card.Content>
          <Text>{t('common.loading')}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, style]}>
      <Card.Title title={title ?? t('history.weekStreak')} />
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.flame}>🔥</Text>
          <View style={styles.countBlock}>
            <Text style={styles.count}>{data.streakCount}</Text>
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
              <View key={day.dateISO} style={[styles.dot, day.isActive && styles.dotFilled]} />
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
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
      color: '#ffffff',
    },
    label: {
      fontSize: 12,
      color: '#9ca3af',
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
      color: '#d1d5db',
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
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#404040',
    },
    dotFilled: {
      backgroundColor: '#ef4444',
      borderWidth: 0,
      borderColor: 'transparent',
    },
  });
