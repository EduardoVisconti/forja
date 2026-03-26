import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface Props {
  secondsRemaining: number;
  nextExerciseName: string | null;
  onSkip: () => void;
  onAdd30: () => void;
  onToggleRestTimer: () => void;
}

export function RestTimerCard({
  secondsRemaining,
  nextExerciseName,
  onSkip,
  onAdd30,
  onToggleRestTimer,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <IconButton
        icon="timer-off-outline"
        size={18}
        iconColor="#9ca3af"
        accessibilityLabel={t('session.disableRest')}
        onPress={onToggleRestTimer}
        style={styles.toggleButton}
      />
      {nextExerciseName ? (
        <Text style={styles.nextExercise}>A seguir: {nextExerciseName}</Text>
      ) : null}
      <Text style={styles.countdown}>{secondsRemaining}</Text>
      <View style={styles.actions}>
        <Button mode="contained" onPress={onSkip} style={styles.button}>
          Pular descanso
        </Button>
        <Button mode="outlined" onPress={onAdd30} style={styles.button}>
          +30s
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 140,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    justifyContent: 'space-between',
    gap: 8,
  },
  toggleButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    margin: 0,
  },
  nextExercise: {
    fontSize: 13,
    color: '#9ca3af',
  },
  countdown: {
    color: '#ef4444',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 52,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
