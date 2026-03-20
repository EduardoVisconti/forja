import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, SegmentedButtons, Text } from 'react-native-paper';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useExercises } from '@/features/workout/hooks/useExercises';
import { useUserPreferences } from '@/features/workout/hooks/useUserPreferences';
import { useWorkoutTemplates } from '@/features/workout/hooks/useWorkoutTemplates';
import { useActiveSession } from '@/features/workout/hooks/useActiveSession';
import { ExerciseFormModal } from '@/features/workout/components/ExerciseFormModal';
import { ExerciseItem } from '@/features/workout/components/ExerciseItem';
import { TemplateFormModal } from '@/features/workout/components/TemplateFormModal';
import type { Exercise } from '@/features/workout/types';
import type { TemplateFormValues } from '@/features/workout/schemas/workoutSchemas';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const { templates, updateTemplate } = useWorkoutTemplates();
  const { startSession } = useActiveSession();
  const { exercises, isLoading, addExercise, updateExercise, deleteExercise, moveExercise } =
    useExercises(id);
  const { unit, setUnit } = useUserPreferences();

  const template = templates.find((t) => t.id === id);

  const [editTemplateVisible, setEditTemplateVisible] = useState(false);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const handleOpenNewExercise = () => {
    setSelectedExercise(null);
    setExerciseModalVisible(true);
  };

  const handleOpenEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseModalVisible(true);
  };

  const handleSaveExercise = async (
    data: Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>,
  ) => {
    if (selectedExercise) {
      await updateExercise(selectedExercise.id, data);
    } else {
      await addExercise(data);
    }
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    Alert.alert(
      t('exercise.deleteTitle'),
      t('exercise.deleteMessage', { name: exercise.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteExercise(exercise.id),
        },
      ],
    );
  };

  const handleSaveTemplate = async (values: TemplateFormValues) => {
    await updateTemplate(id, values);
  };

  if (!template) {
    return (
      <View style={styles.center}>
        <Text>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: template.name,
          headerRight: () => (
            <Text
              style={styles.editLink}
              onPress={() => setEditTemplateVisible(true)}
            >
              {t('common.edit')}
            </Text>
          ),
        }}
      />

      {/* Unit preference toggle */}
      <View style={styles.unitRow}>
        <SegmentedButtons
          value={unit}
          onValueChange={(v) => setUnit(v as 'kg' | 'lbs')}
          buttons={[
            { value: 'kg', label: 'kg' },
            { value: 'lbs', label: 'lbs' },
          ]}
          style={styles.unitToggle}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('exercise.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ExerciseItem
              exercise={item}
              unit={unit}
              isFirst={index === 0}
              isLast={index === exercises.length - 1}
              onMoveUp={() => moveExercise(item.id, 'up')}
              onMoveDown={() => moveExercise(item.id, 'down')}
              onEdit={() => handleOpenEditExercise(item)}
              onDelete={() => handleDeleteExercise(item)}
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={handleOpenNewExercise} />

      <Button
        mode="contained"
        icon="play"
        onPress={() => template && startSession(template)}
        style={styles.startButton}
      >
        {t('session.start')}
      </Button>

      <TemplateFormModal
        visible={editTemplateVisible}
        initial={{ name: template.name, type: template.type }}
        onSubmit={handleSaveTemplate}
        onDismiss={() => setEditTemplateVisible(false)}
      />

      <ExerciseFormModal
        visible={exerciseModalVisible}
        unit={unit}
        initial={selectedExercise}
        onSubmit={handleSaveExercise}
        onDismiss={() => setExerciseModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unitToggle: {
    alignSelf: 'center',
    maxWidth: 200,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 90,
  },
  startButton: {
    margin: 16,
    marginBottom: 24,
  },
  editLink: {
    fontSize: 16,
    color: '#16a34a',
  },
});
