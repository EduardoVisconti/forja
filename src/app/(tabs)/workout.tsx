import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    moveTemplateUp,
    moveTemplateDown,
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
        <FlatList
          data={templates}
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
          renderItem={({ item, index }) => (
            <View style={styles.templateRow}>
              <View style={styles.reorder}>
                <IconButton
                  icon="chevron-up"
                  size={18}
                  disabled={index === 0}
                  onPress={() => {
                    void moveTemplateUp(item.id);
                  }}
                  style={styles.reorderBtn}
                />
                <IconButton
                  icon="chevron-down"
                  size={18}
                  disabled={index === templates.length - 1}
                  onPress={() => {
                    void moveTemplateDown(item.id);
                  }}
                  style={styles.reorderBtn}
                />
              </View>
              <View style={styles.templateCardContainer}>
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
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: 16,
      paddingBottom: 100,
    },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reorder: {
      flexDirection: 'column',
      alignItems: 'center',
      paddingRight: 4,
      paddingBottom: 12,
    },
    reorderBtn: {
      margin: 0,
      width: 28,
      height: 28,
    },
    templateCardContainer: {
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
