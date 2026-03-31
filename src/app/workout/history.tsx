import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/tokens';
import { AddManualSessionModal } from '@/features/workout/components/AddManualSessionModal';
import { useSessionHistory } from '@/features/workout/hooks/useSessionHistory';
import { useWorkoutTemplates } from '@/features/workout/hooks/useWorkoutTemplates';
import type { WorkoutSession } from '@/features/workout/types/session';
import type { WorkoutTemplate } from '@/features/workout/types';

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatMetricValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export default function WorkoutHistoryScreen() {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const { sessions, isLoading, error, reload, deleteSession, createManualSession } = useSessionHistory();
  const { templates } = useWorkoutTemplates();

  const handleDelete = (session: WorkoutSession) => {
    Alert.alert(t('workout.history.deleteTitle'), t('workout.history.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteSession(session.id);
        },
      },
    ]);
  };

  const handleSaveManual = async (template: WorkoutTemplate, date: string) => {
    setIsSavingManual(true);
    try {
      await createManualSession(template.id, template.name, date);
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: t('workout.history.title'),
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#ffffff',
          headerBackTitle: '',
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('workout.history.title')}</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <IconButton icon="refresh" onPress={reload} />
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('workout.history.empty')}</Text>}
            renderItem={({ item }) => {
              const showDuration = item.durationMinutes > 0;
              const showVolume = item.totalVolumeKg > 0;

              return (
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.templateName}>{item.templateName}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.dateText}>{formatDate(item.finishedAt)}</Text>
                      {showDuration ? (
                        <Text style={styles.metaText}>{`${item.durationMinutes} min`}</Text>
                      ) : null}
                      {showVolume ? (
                        <Text style={styles.metaText}>{`${formatMetricValue(item.totalVolumeKg)} kg`}</Text>
                      ) : null}
                    </View>
                    {item.isManual ? (
                      <View style={styles.manualTag}>
                        <Text style={styles.manualTagText}>{t('workout.history.manualTag')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <IconButton icon="trash-can-outline" size={20} onPress={() => handleDelete(item)} />
                </View>
              );
            }}
          />
        )}

        <FAB icon="plus" style={styles.fab} onPress={() => setModalVisible(true)} />

        <AddManualSessionModal
          visible={modalVisible}
          templates={templates}
          isSaving={isSavingManual}
          onDismiss={() => setModalVisible(false)}
          onSave={handleSaveManual}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1e1e1e',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flex: 1,
    gap: 6,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  metaText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  manualTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  manualTagText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingTop: 56,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: colors.workout,
  },
});
