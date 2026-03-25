import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, FAB, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    reload,
  } = useWorkoutTemplates();
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('workout.loadError')}</Text>
          <Button mode="contained-tonal" onPress={reload}>
            {t('common.retry')}
          </Button>
        </View>
      ) : (
        <DraggableFlatList
          data={templates}
          onDragEnd={({ data }) => reorderTemplates(data)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔥</Text>
              <Text style={styles.emptyText}>{t('workout.emptyHint')}</Text>
              <Button mode="contained" onPress={handleOpenCreate} style={styles.emptyAction}>
                {t('workout.emptyAction')}
              </Button>
            </View>
          }
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <View style={styles.draggableRow}>
                <TouchableOpacity onLongPress={drag} style={styles.dragHandle} delayLongPress={120}>
                  <MaterialCommunityIcons
                    name="drag-horizontal-variant"
                    size={20}
                    color={isActive ? '#ef4444' : '#525252'}
                  />
                </TouchableOpacity>
                <View style={styles.cardContainer}>
                  <TemplateCard
                    template={item}
                    exerciseCount={exerciseCounts[item.id] ?? 0}
                    onPress={() => handlePressCard(item)}
                    onEdit={() => handleOpenEdit(item)}
                    onDelete={() => handleDelete(item)}
                    onStart={() => startSession(item)}
                  />
                </View>
              </View>
            </ScaleDecorator>
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

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
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
    draggableRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dragHandle: {
      padding: 8,
      marginRight: 4,
      marginBottom: 12,
    },
    cardContainer: {
      flex: 1,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: 20,
      gap: 12,
    },
    emptyIcon: {
      fontSize: 32,
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyAction: {
      marginTop: 4,
    },
    errorText: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 24,
    },
  });
