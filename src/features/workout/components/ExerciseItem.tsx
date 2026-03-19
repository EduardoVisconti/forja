import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Exercise, UserPreferences } from '../types';

const KG_TO_LBS = 2.205;

function formatWeight(weightKg: number, unit: UserPreferences['unit']): string {
  if (unit === 'lbs') {
    return `${(weightKg * KG_TO_LBS).toFixed(1)} lbs`;
  }
  return `${weightKg} kg`;
}

function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}min` : `${m}min ${s}s`;
}

interface ExerciseItemProps {
  exercise: Exercise;
  unit: UserPreferences['unit'];
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExerciseItem({
  exercise,
  unit,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: ExerciseItemProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={styles.reorder}>
        <IconButton
          icon="chevron-up"
          size={18}
          disabled={isFirst}
          onPress={onMoveUp}
          style={styles.reorderBtn}
        />
        <IconButton
          icon="chevron-down"
          size={18}
          disabled={isLast}
          onPress={onMoveDown}
          style={styles.reorderBtn}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.details}>
          {t('exercise.setsReps', { sets: exercise.sets, reps: exercise.reps })}
          {exercise.weight > 0 ? ` · ${formatWeight(exercise.weight, unit)}` : ''}
          {` · ${formatRest(exercise.restSeconds)}`}
        </Text>
        {exercise.notes ? <Text style={styles.notes}>{exercise.notes}</Text> : null}
      </View>

      <View style={styles.actions}>
        <IconButton icon="pencil-outline" size={18} onPress={onEdit} />
        <IconButton icon="trash-can-outline" size={18} onPress={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  reorder: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  reorderBtn: {
    margin: 0,
    width: 28,
    height: 28,
  },
  info: {
    flex: 1,
    paddingHorizontal: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  details: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
