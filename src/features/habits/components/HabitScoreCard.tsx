import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const TOTAL_HABITS = 8;

interface Props {
  score: number;
  streak: number;
}

export function HabitScoreCard({ score, streak }: Props) {
  const { t } = useTranslation();
  const progress = score / TOTAL_HABITS;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="displaySmall" style={styles.scoreNumber}>
              {score}
              <Text variant="headlineSmall" style={styles.total}>
                /{TOTAL_HABITS}
              </Text>
            </Text>
            <Text variant="labelMedium" style={styles.label}>
              {t('habits.scoreLabel')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="displaySmall" style={styles.streakNumber}>
              {streak}
            </Text>
            <Text variant="labelMedium" style={styles.label}>
              {t('habits.streakLabel')}
            </Text>
          </View>
        </View>
        <ProgressBar
          progress={progress}
          style={styles.progressBar}
          color={progress >= 1 ? '#16a34a' : '#3b82f6'}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16 },
  content: { gap: 16 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center', gap: 4 },
  scoreNumber: { fontWeight: 'bold', color: '#111827' },
  streakNumber: { fontWeight: 'bold', color: '#f59e0b' },
  total: { color: '#9ca3af' },
  label: { color: '#6b7280' },
  divider: { width: 1, height: 56, backgroundColor: '#e5e7eb' },
  progressBar: { height: 8, borderRadius: 4 },
});
