import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface Props {
  secondsRemaining: number;
  nextExerciseName: string | null;
  onSkip: () => void;
  onAdd30: () => void;
}

export function RestTimerCard({ secondsRemaining, nextExerciseName, onSkip, onAdd30 }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="labelMedium" style={styles.next}>
          {t('session.nextExercise')}: {nextExerciseName ?? '-'}
        </Text>
        <Text variant="displaySmall" style={styles.time}>
          {secondsRemaining}
        </Text>
        <View style={styles.actions}>
          <Button mode="contained" onPress={onSkip} style={styles.button}>
            {t('timer.skip')}
          </Button>
          <Button mode="outlined" onPress={onAdd30} style={styles.button}>
            {t('timer.add30')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 0,
      maxHeight: 140,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 10,
    },
    next: {
      color: theme.colors.onSurfaceVariant,
    },
    time: {
      color: theme.colors.error,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 42,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      flex: 1,
    },
  });
