import { FlatList, StyleSheet, View } from 'react-native';
import { Card, List, Text } from 'react-native-paper';
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
          <Text>{t('history.pr.emptyHint')}</Text>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.exerciseId}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const bestDate = formatDDMMYYYY(item.bestAtISO);
              const bestWeight = Math.round(item.bestWeightKg);

              return (
                <List.Item
                  title={item.exerciseName}
                  description={t('history.pr.bestLine', { weight: bestWeight, date: bestDate })}
                  onPress={() => onPressExercise(item.exerciseId)}
                  titleStyle={styles.title}
                  style={styles.listItem}
                />
              );
            }}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  title: { fontWeight: '700' },
  listItem: { backgroundColor: '#141414' },
});

