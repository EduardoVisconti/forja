import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutTemplates } from '@/features/workout/hooks/useWorkoutTemplates';
import { TemplateCard } from '@/features/workout/components/TemplateCard';
import { TemplateFormModal } from '@/features/workout/components/TemplateFormModal';
import { useActiveSession } from '@/features/workout/hooks/useActiveSession';
import type { WorkoutTemplate } from '@/features/workout/types';
import type { TemplateFormValues } from '@/features/workout/schemas/workoutSchemas';
import { useExerciseCounts } from '@/features/workout/hooks/useExerciseCounts';

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } =
    useWorkoutTemplates();
  const exerciseCounts = useExerciseCounts(templates);
  const { startSession } = useActiveSession();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setModalVisible(true);
  };

  const handleSave = async (values: TemplateFormValues) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, values);
    } else {
      await createTemplate(values);
    }
  };

  const handleDelete = (template: WorkoutTemplate) => {
    Alert.alert(
      t('workout.deleteTitle'),
      t('workout.deleteMessage', { name: template.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteTemplate(template.id),
        },
      ],
    );
  };

  const handlePressCard = (template: WorkoutTemplate) => {
    router.push(`/workout/edit/${template.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('workout.title')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('workout.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              exerciseCount={exerciseCounts[item.id] ?? 0}
              onPress={() => handlePressCard(item)}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item)}
              onStart={() => startSession(item)}
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={handleOpenCreate} />

      <TemplateFormModal
        visible={modalVisible}
        initial={editingTemplate ? { name: editingTemplate.name, type: editingTemplate.type } : null}
        onSubmit={handleSave}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
