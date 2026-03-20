import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardioCategoryFilter } from '@/features/cardio/components/CardioCategoryFilter';
import { CardioFormModal } from '@/features/cardio/components/CardioFormModal';
import { CardioLogItem } from '@/features/cardio/components/CardioLogItem';
import { useCardioLog } from '@/features/cardio/hooks/useCardioLog';
import type { CardioFormValues } from '@/features/cardio/schemas/cardioSchemas';
import type { CardioLog } from '@/features/cardio/types';
import { useUserPreferences } from '@/features/workout/hooks/useUserPreferences';

export default function CardioScreen() {
  const { t } = useTranslation();
  const { unit } = useUserPreferences();
  const { logs, isLoading, activeFilter, setActiveFilter, createLog, updateLog, deleteLog } =
    useCardioLog();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<CardioLog | null>(null);

  const handleOpenNew = () => {
    setEditingLog(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (log: CardioLog) => {
    setEditingLog(log);
    setModalVisible(true);
  };

  const handleSubmit = async (values: CardioFormValues) => {
    if (editingLog) {
      await updateLog(editingLog.id, {
        date: values.date,
        trainingType: values.trainingType,
        zone: values.zone,
        durationMinutes: values.durationMinutes,
        distanceKm: values.distance,
        avgPace: values.avgPace,
        avgHr: values.avgHr,
        notes: values.notes,
      });
    } else {
      await createLog({
        date: values.date,
        trainingType: values.trainingType,
        zone: values.zone,
        durationMinutes: values.durationMinutes,
        distanceKm: values.distance,
        avgPace: values.avgPace,
        avgHr: values.avgHr,
        notes: values.notes,
      });
    }
    setModalVisible(false);
  };

  const handleDelete = (log: CardioLog) => {
    Alert.alert(t('cardio.deleteTitle'), t('cardio.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteLog(log.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cardio.title')}</Text>
      </View>

      <CardioCategoryFilter activeFilter={activeFilter} onSelect={setActiveFilter} />

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('cardio.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CardioLogItem
              log={item}
              unit={unit}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={handleOpenNew} />

      <CardioFormModal
        visible={modalVisible}
        unit={unit}
        initial={editingLog}
        onSubmit={handleSubmit}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#9ca3af', textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
