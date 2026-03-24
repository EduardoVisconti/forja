import { StyleSheet, View } from 'react-native';
import { IconButton, List, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
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
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View>
      {exercises.map((item, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex || item.skipped;

        return (
          <List.Item
            key={item.id}
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
      })}
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    item: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    current: { backgroundColor: theme.colors.secondaryContainer },
    done: { color: theme.colors.onSurfaceVariant },
    skipped: { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' },
    skippedBadge: { alignSelf: 'center', color: theme.colors.onSurfaceVariant, fontSize: 12 },
    reorder: { flexDirection: 'column', justifyContent: 'center' },
  });
