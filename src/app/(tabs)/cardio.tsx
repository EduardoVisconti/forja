import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const { unit } = useUserPreferences();
  const {
    logs,
    isLoading,
    error,
    activeFilter,
    setActiveFilter,
    createLog,
    updateLog,
    deleteLog,
    reload,
  } = useCardioLog();

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
        duration: values.duration,
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
        duration: values.duration,
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('cardio.loadError')}</Text>
          <Button mode="contained-tonal" onPress={reload}>
            {t('common.retry')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏃</Text>
              <Text style={styles.emptyText}>{t('cardio.emptyHint')}</Text>
              <Button mode="contained" onPress={handleOpenNew} style={styles.emptyAction}>
                {t('cardio.emptyAction')}
              </Button>
            </View>
          }
          renderItem={({ item }) => (
            <CardioLogItem
              log={item}
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

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20, gap: 12 },
    emptyIcon: { fontSize: 30 },
    emptyText: { fontSize: 15, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    emptyAction: { marginTop: 4 },
    errorText: { color: theme.colors.primary, textAlign: 'center', marginBottom: 12 },
    fab: { position: 'absolute', right: 16, bottom: 24 },
  });
