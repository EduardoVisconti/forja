import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { PrExerciseVM } from '../types/historyTypes';

function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  exercises: PrExerciseVM[];
  onPressExercise: (exerciseId: string) => void;
}

export function PrExerciseList({ exercises, onPressExercise }: Props) {
  const { t } = useTranslation();

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
              const bestDate = formatDDMMYYYY(item.bestAtISO);
              const bestWeight = Math.round(item.bestWeightKg);

              return (
                <View key={item.exerciseId}>
                  <Pressable onPress={() => onPressExercise(item.exerciseId)} style={styles.listItem}>
                    <View style={styles.row}>
                      <Text style={styles.title}>{item.exerciseName}</Text>
                      <Text style={styles.description}>
                        {t('history.pr.bestLine', { weight: bestWeight, date: bestDate })}
                      </Text>
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

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  title: { fontWeight: '600', fontSize: 13 },
  description: { fontSize: 11 },
  listItem: { backgroundColor: '#141414', paddingVertical: 4 },
  row: { justifyContent: 'center' },
});

