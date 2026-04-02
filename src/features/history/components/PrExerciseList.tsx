import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { PrExerciseVM } from '../types/historyTypes';

interface Props {
  exercises: PrExerciseVM[];
  onPressExercise: (exerciseId: string) => void;
  unit: 'kg' | 'lbs';
}

const KG_TO_LBS = 2.20462;

export function PrExerciseList({ exercises, onPressExercise, unit }: Props) {
  const { t } = useTranslation();
  const formatBestWeight = (weightKg: number) =>
    unit === 'lbs' ? (weightKg * KG_TO_LBS).toFixed(1) : weightKg.toFixed(1);

  return (
    <Card style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: '#141414' }}>
      <Card.Title title={t('history.pr.title')} />
      <Card.Content>
        {exercises.length === 0 ? (
          <Text>{t('history.prEmpty', { defaultValue: t('history.pr.emptyHint') })}</Text>
        ) : (
          <ScrollView
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {exercises.map((item, index) => {
              const bestWeight = formatBestWeight(item.bestWeightKg);
              const diffKg = getPreviousRecordDiffKg(item);

              return (
                <View key={item.exerciseId}>
                  <Pressable onPress={() => onPressExercise(item.exerciseId)} style={styles.listItem}>
                    <View style={styles.row}>
                      <Text style={styles.title}>{item.exerciseName}</Text>
                      <Text style={styles.bestLine}>{`Melhor: ${bestWeight} ${unit}`}</Text>
                      {diffKg !== null && Math.abs(diffKg) > 0.05 ? (
                        <Text style={styles.diffLine}>{`+${diffKg.toFixed(1)}kg ${t('summary.vsLast')}`}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                  {index < exercises.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}

function getPreviousRecordDiffKg(item: PrExerciseVM): number | null {
  let runningMax = Number.NEGATIVE_INFINITY;
  const milestones: number[] = [];

  for (const point of item.progression) {
    if (point.weightKg > runningMax) {
      runningMax = point.weightKg;
      milestones.push(point.weightKg);
    }
  }

  if (milestones.length < 2) return null;
  return milestones[milestones.length - 1] - milestones[milestones.length - 2];
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  title: { fontWeight: '600', fontSize: 13, color: '#ffffff' },
  bestLine: { fontSize: 12, color: colors.complete, marginTop: 2 },
  diffLine: { fontSize: 11, color: '#525252', marginTop: 2 },
  listItem: { backgroundColor: '#141414', paddingVertical: 4 },
  row: { justifyContent: 'center' },
});

