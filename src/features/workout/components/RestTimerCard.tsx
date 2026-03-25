import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface Props {
  secondsRemaining: number;
  nextExerciseName: string | null;
  onSkip: () => void;
  onAdd30: () => void;
}

export function RestTimerCard({ secondsRemaining, nextExerciseName, onSkip, onAdd30 }: Props) {
  return (
    <View style={styles.container}>
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
    minHeight: 140,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    justifyContent: 'space-between',
    gap: 8,
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
