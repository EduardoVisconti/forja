import { FlatList, StyleSheet, View } from 'react-native';
import { IconButton, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SessionExercise } from '../types/session';

interface Props {
  exercises: SessionExercise[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onSkip: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function ExerciseQueuePanel({
  exercises,
  currentIndex,
  onSelect,
  onSkip,
  onMoveUp,
  onMoveDown,
}: Props) {
  const { t } = useTranslation();

  return (
    <FlatList
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex || item.skipped;

        return (
          <List.Item
            title={item.name}
            description={`${item.sets}×${item.reps}`}
            titleStyle={[isDone && styles.done, item.skipped && styles.skipped]}
            style={[styles.item, isCurrent && styles.current]}
            onPress={() => !item.skipped && onSelect(index)}
            left={(props) => (
              <View style={styles.reorder}>
                <IconButton
                  {...props}
                  icon="chevron-up"
                  size={18}
                  disabled={index === 0}
                  onPress={() => onMoveUp(index)}
                />
                <IconButton
                  {...props}
                  icon="chevron-down"
                  size={18}
                  disabled={index === exercises.length - 1}
                  onPress={() => onMoveDown(index)}
                />
              </View>
            )}
            right={(props) =>
              !item.skipped ? (
                <IconButton
                  {...props}
                  icon="debug-step-over"
                  size={18}
                  onPress={() => onSkip(index)}
                />
              ) : (
                <Text {...props} style={styles.skippedBadge}>
                  {t('session.skipped')}
                </Text>
              )
            }
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  current: { backgroundColor: '#f0f4ff' },
  done: { color: 'gray' },
  skipped: { color: 'gray', textDecorationLine: 'line-through' },
  skippedBadge: { alignSelf: 'center', color: 'gray', fontSize: 12 },
  reorder: { flexDirection: 'column', justifyContent: 'center' },
});
