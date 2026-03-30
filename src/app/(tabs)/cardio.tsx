import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Button, FAB, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/tokens';
import { CardioActionSheet } from '@/features/cardio/components/CardioActionSheet';
import { CardioCategoryFilter, type CardioFilterValue } from '@/features/cardio/components/CardioCategoryFilter';
import { CardioPlanCard } from '@/features/cardio/components/CardioPlanCard';
import {
  CardioPlanFormModal,
  type CardioPlanFormValues,
} from '@/features/cardio/components/CardioPlanFormModal';
import { CardioRecordCard } from '@/features/cardio/components/CardioRecordCard';
import {
  CardioRecordFormModal,
  type CardioRecordFormValues,
} from '@/features/cardio/components/CardioRecordFormModal';
import { useCardioPlans } from '@/features/cardio/hooks/useCardioPlans';
import { useCardioRecords } from '@/features/cardio/hooks/useCardioRecords';
import type { CardioPlan, CardioRecord } from '@/features/cardio/types/plans';

type InternalTab = 'plans' | 'records';

function matchesFilter(record: CardioRecord, filter: CardioFilterValue): boolean {
  if (!filter) return true;
  return record.trainingType === filter || record.zone === filter;
}

export default function CardioScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InternalTab>('plans');
  const [activeFilter, setActiveFilter] = useState<CardioFilterValue>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CardioPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<CardioPlan | null>(null);
  const [editingRecord, setEditingRecord] = useState<CardioRecord | null>(null);

  const {
    pendingPlans,
    completedPlans,
    plans,
    isLoading: plansLoading,
    error: plansError,
    createPlan,
    updatePlan,
    deletePlan,
    reload: reloadPlans,
  } = useCardioPlans();

  const {
    records,
    isLoading: recordsLoading,
    error: recordsError,
    createRecord,
    updateRecord,
    deleteRecord,
    reload: reloadRecords,
  } = useCardioRecords();

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesFilter(record, activeFilter)),
    [records, activeFilter],
  );

  const loading = plansLoading || recordsLoading;
  const error = plansError ?? recordsError;

  const handleOpenPlanModal = (plan: CardioPlan | null = null) => {
    setEditingPlan(plan);
    setPlanModalVisible(true);
  };

  const handleOpenRecordModal = (record: CardioRecord | null = null) => {
    setEditingRecord(record);
    setRecordModalVisible(true);
  };

  const handleSavePlan = async (values: CardioPlanFormValues) => {
    if (editingPlan) {
      await updatePlan(editingPlan.id, values);
      return;
    }
    await createPlan(values);
  };

  const handleDeletePlan = (plan: CardioPlan) => {
    Alert.alert(t('cardioPlan.deletePlanTitle'), t('cardioPlan.deletePlanMessage', { title: plan.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deletePlan(plan.id),
      },
    ]);
  };

  const handlePendingPlanAction = (plan: CardioPlan) => {
    setSelectedPlan(plan);
    setActionSheetVisible(true);
  };

  const handleSaveRecord = async (values: CardioRecordFormValues) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, values);
      return;
    }
    await createRecord(values);
  };

  const handleDeleteRecord = (record: CardioRecord) => {
    Alert.alert(t('cardioPlan.deleteRecordTitle'), t('cardioPlan.deleteRecordMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteRecord(record.id),
      },
    ]);
  };

  const handleRegisterAsDone = () => {
    if (!selectedPlan) return;
    setActionSheetVisible(false);
    router.push(`/cardio/complete/${selectedPlan.id}`);
  };

  const handleEditFromSheet = () => {
    if (!selectedPlan) return;
    setActionSheetVisible(false);
    handleOpenPlanModal(selectedPlan);
  };

  const handleSkipReschedule = () => {
    setActionSheetVisible(false);
    Alert.alert(t('cardioPlan.skipReschedule'), t('cardioPlan.skipRescheduleSoon'));
  };

  const renderPlanosTab = () => (
    <FlatList
      data={pendingPlans}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('cardioPlan.pending')}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('cardioPlan.emptyPlans')}</Text>
        </View>
      }
      ListFooterComponent={
        completedPlans.length > 0 ? (
          <View style={styles.completedSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('cardioPlan.completedRecently')}
            </Text>
            <FlatList
              data={completedPlans}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <CardioPlanCard
                  plan={item}
                  onComplete={() => setActiveTab('records')}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                />
              )}
            />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <CardioPlanCard
          plan={item}
          onComplete={() => handlePendingPlanAction(item)}
          onEdit={() => handleOpenPlanModal(item)}
          onDelete={() => handleDeletePlan(item)}
        />
      )}
    />
  );

  const renderRegistrosTab = () => (
    <View style={styles.recordsWrapper}>
      <CardioCategoryFilter activeFilter={activeFilter} onSelect={setActiveFilter} />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('cardioPlan.emptyRecords')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CardioRecordCard
            record={item}
            onEdit={() => handleOpenRecordModal(item)}
            onDelete={() => handleDeleteRecord(item)}
          />
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{t('cardio.loadError')}</Text>
          <Button
            mode="contained-tonal"
            onPress={() => {
              reloadPlans();
              reloadRecords();
            }}
          >
            {t('common.retry')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cardio.screenTitle')}</Text>
        <Text style={styles.subtitle}>{t('cardio.screenSubtitle')}</Text>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as InternalTab)}
        style={styles.tabSwitch}
        buttons={[
          { value: 'plans', label: t('cardioPlan.title') },
          { value: 'records', label: t('cardioPlan.records') },
        ]}
      />

      {activeTab === 'plans' ? renderPlanosTab() : renderRegistrosTab()}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'plans') {
            handleOpenPlanModal();
            return;
          }
          handleOpenRecordModal();
        }}
      />

      <CardioPlanFormModal
        visible={planModalVisible}
        initial={editingPlan}
        onSubmit={handleSavePlan}
        onDismiss={() => setPlanModalVisible(false)}
      />

      <CardioRecordFormModal
        visible={recordModalVisible}
        initial={editingRecord}
        onSubmit={handleSaveRecord}
        onDismiss={() => setRecordModalVisible(false)}
      />

      <CardioActionSheet
        visible={actionSheetVisible}
        onDismiss={() => setActionSheetVisible(false)}
        onRegisterAsDone={handleRegisterAsDone}
        onEditPlan={handleEditFromSheet}
        onSkipReschedule={handleSkipReschedule}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabSwitch: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  recordsWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  completedSection: {
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  errorText: {
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: colors.cardio,
  },
});
