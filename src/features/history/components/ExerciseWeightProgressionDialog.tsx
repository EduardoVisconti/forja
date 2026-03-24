import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { PrExerciseVM } from '../types/historyTypes';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { useWindowDimensions } from 'react-native';

function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  visible: boolean;
  exercise: PrExerciseVM | null;
  onDismiss: () => void;
}

export function ExerciseWeightProgressionDialog({ visible, exercise, onDismiss }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - 56, 260);
  const yMax = exercise ? Math.max(...exercise.progression.map((p) => p.weightKg), 0) : 0;

  const points =
    exercise?.progression?.map((p) => ({
      value: p.weightKg,
      label: formatDDMMYYYY(p.dateISO),
    })) ?? [];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{exercise?.exerciseName ?? t('history.pr.dialogTitleFallback')}</Dialog.Title>
        <Dialog.Content>
          {exercise ? (
            <View style={styles.content}>
              <Text style={styles.bestLine}>
                {t('history.pr.dialogBestLine', {
                  weight: Math.round(exercise.bestWeightKg),
                  date: formatDDMMYYYY(exercise.bestAtISO),
                })}
              </Text>

              {exercise.progression.length > 0 ? (
                <SimpleLineChart
                  points={points}
                  width={chartWidth}
                  height={220}
                  yMax={yMax}
                  strokeColor="#3b82f6"
                />
              ) : (
                <Text>{t('history.pr.dialogEmpty')}</Text>
              )}
            </View>
          ) : (
            <Text>{t('common.loading')}</Text>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { maxWidth: 520, backgroundColor: '#141414' },
  content: { gap: 12 },
  bestLine: { fontWeight: '700' },
});

