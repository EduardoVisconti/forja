import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';

interface Props {
  score: number;
  totalActive: number;
  streak: number;
}

export function HabitScoreCard({ score, totalActive, streak }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const progress = totalActive > 0 ? score / totalActive : 0;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="displayMedium" style={styles.scoreNumber}>
              {score}
              <Text variant="headlineSmall" style={styles.total}>
                /{totalActive}
              </Text>
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
          color={colors.complete}
        />
      </Card.Content>
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      margin: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    content: { gap: 16 },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    stat: { alignItems: 'center', gap: 4 },
    scoreNumber: { fontWeight: '700', color: colors.textPrimary },
    streakNumber: { fontWeight: '700', color: colors.complete },
    total: { color: '#9ca3af' },
    label: { color: colors.textMuted },
    divider: { width: 1, height: 56, backgroundColor: theme.colors.outline },
    progressBar: { height: 8, borderRadius: 4 },
  });
