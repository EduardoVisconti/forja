import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, List, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SessionExercise } from '../types/session';

interface Props {
  exercises: SessionExercise[];
  currentIndex: number;
  completedExercises: Record<string, boolean>;
  maxHeight?: number;
  onSelect: (index: number) => void;
  onSkip: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function ExerciseQueuePanel({
  exercises,
  currentIndex,
  completedExercises,
  maxHeight = 220,
  onSelect,
  onSkip,
  onMoveUp,
  onMoveDown,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme, maxHeight);

  return (
    <View style={styles.container}>
      <ScrollView nestedScrollEnabled>
        {exercises.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = Boolean(completedExercises[item.id]);
          const isDone = isCompleted || item.skipped;

          return (
            <List.Item
              key={item.id}
              title={() => (
                <View style={styles.titleRow}>
                  <Text style={[styles.titleText, isDone && styles.done, item.skipped && styles.skipped]}>
                    {item.name}
                  </Text>
                  {isCompleted ? <Text style={styles.completedMark}>{'\u2713'}</Text> : null}
                </View>
              )}
              description={`${item.sets}x${item.reps}`}
              descriptionStyle={[styles.descriptionText, isDone && styles.done, item.skipped && styles.skipped]}
              style={[styles.item, isCompleted && styles.completed, isCurrent && styles.current]}
              contentStyle={styles.itemContent}
              onPress={() => !item.skipped && onSelect(index)}
              left={(props) => (
                <View style={styles.reorder}>
                  <IconButton
                    {...props}
                    icon="chevron-up"
                    size={14}
                    style={styles.reorderButton}
                    disabled={index === 0}
                    onPress={() => onMoveUp(index)}
                  />
                  <IconButton
                    {...props}
                    icon="chevron-down"
                    size={14}
                    style={styles.reorderButton}
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
                    style={styles.skipButton}
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
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: MD3Theme, maxHeight: number) =>
  StyleSheet.create({
    container: { maxHeight },
    item: {
      height: 64,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    itemContent: { paddingVertical: 0, paddingRight: 4 },
    current: { backgroundColor: theme.colors.secondaryContainer },
    completed: { opacity: 0.6 },
    done: { color: theme.colors.onSurfaceVariant },
    skipped: { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' },
    skippedBadge: { alignSelf: 'center', color: theme.colors.onSurfaceVariant, fontSize: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    titleText: { color: theme.colors.onSurface, fontSize: 15 },
    descriptionText: { fontSize: 13 },
    completedMark: { marginLeft: 6, color: '#ef4444', fontSize: 16, fontWeight: '700' },
    reorder: { flexDirection: 'column', justifyContent: 'center' },
    reorderButton: { margin: 0, width: 20, height: 20 },
    skipButton: { marginVertical: 0 },
  });
