import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface Props {
  secondsRemaining: number;
  onSkip: () => void;
  onAdd30: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestTimerOverlay({ secondsRemaining, onSkip, onAdd30 }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.label}>
        {t('timer.resting')}
      </Text>
      <Text variant="displayMedium" style={styles.time}>
        {formatTime(secondsRemaining)}
      </Text>
      <View style={styles.actions}>
        <Button mode="outlined" onPress={onAdd30} style={styles.button}>
          {t('timer.add30')}
        </Button>
        <Button mode="contained" onPress={onSkip} style={styles.button}>
          {t('timer.skip')}
        </Button>
      </View>
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
      gap: 16,
      backgroundColor: theme.colors.background,
    },
    label: { color: theme.colors.onSurfaceVariant },
    time: { fontWeight: 'bold', color: theme.colors.onSurface },
    actions: { flexDirection: 'row', gap: 12 },
    button: { flex: 1 },
  });
