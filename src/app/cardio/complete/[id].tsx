import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/tokens';
import { useCardioPlans } from '@/features/cardio/hooks/useCardioPlans';
import { useCardioRecords } from '@/features/cardio/hooks/useCardioRecords';

interface CompletionFormState {
  performedAt: string;
  duration: string;
  distanceKm: string;
  avgPace: string;
  avgHr: string;
  zone: string | null;
  perceivedEffort: string;
  notes: string;
}

const ZONES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function createInitialForm(plan: {
  targetDuration: string | null;
  targetDistance: number | null;
  targetPace: string | null;
  targetZone: string | null;
  notes: string | null;
}): CompletionFormState {
  return {
    performedAt: todayISO(),
    duration: plan.targetDuration ?? '',
    distanceKm: plan.targetDistance !== null ? String(plan.targetDistance) : '',
    avgPace: plan.targetPace ?? '',
    avgHr: '',
    zone: plan.targetZone ?? null,
    perceivedEffort: '',
    notes: plan.notes ?? '',
  };
}

export default function CompleteCardioPlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const planId = params.id ?? '';

  const { plans, completePlan } = useCardioPlans();
  const { createRecord } = useCardioRecords();
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState<CompletionFormState | null>(null);
  const initialSnapshotRef = useRef<string>('');

  const plan = useMemo(() => plans.find((item) => item.id === planId) ?? null, [plans, planId]);

  useEffect(() => {
    if (!plan || form) return;
    const nextForm = createInitialForm(plan);
    setForm(nextForm);
    initialSnapshotRef.current = JSON.stringify(nextForm);
  }, [plan, form]);

  const hasUnsavedChanges = useMemo(() => {
    if (!form) return false;
    return JSON.stringify(form) !== initialSnapshotRef.current;
  }, [form]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!hasUnsavedChanges || isSaving) return;
      event.preventDefault();
      Alert.alert(t('cardioPlan.unsavedTitle'), t('cardioPlan.unsavedMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('cardioPlan.leave'),
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, isSaving, navigation, t]);

  const updateField = <K extends keyof CompletionFormState>(
    field: K,
    value: CompletionFormState[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'set' || !selectedDate) return;
    updateField('performedAt', selectedDate.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!plan || !form) return;

    const parsedDistance = parseFloat(form.distanceKm.replace(',', '.'));
    const parsedAvgHr = parseInt(form.avgHr, 10);
    const parsedRpe = parseInt(form.perceivedEffort, 10);

    try {
      setIsSaving(true);
      const newRecord = await createRecord({
        planId: plan.id,
        activityType: plan.activityType,
        trainingType: plan.trainingType,
        performedAt: form.performedAt,
        duration: form.duration.trim() || null,
        distanceKm: Number.isFinite(parsedDistance) ? parsedDistance : null,
        avgPace: form.avgPace.trim() || null,
        avgHr: Number.isFinite(parsedAvgHr) ? parsedAvgHr : null,
        zone: form.zone,
        notes: form.notes.trim() || null,
        perceivedEffort: Number.isFinite(parsedRpe) ? Math.min(10, Math.max(1, parsedRpe)) : null,
      });
      await completePlan(plan.id, newRecord.id);
      router.replace('/(tabs)/cardio');
    } finally {
      setIsSaving(false);
    }
  };

  if (!plan || !form) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: t('cardioPlan.completePlan') }} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('cardioPlan.planNotFound')}</Text>
          <Button mode="contained" onPress={() => router.replace('/(tabs)/cardio')}>
            {t('common.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: t('cardioPlan.completePlan') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cardioPlan.plannedLabel')}
          </Text>
          <Card style={styles.plannedCard}>
            <Card.Content style={styles.plannedContent}>
              <Text variant="titleMedium" style={styles.primaryText}>
                {plan.title}
              </Text>
              <Text style={styles.mutedText}>{formatDate(plan.plannedDate)}</Text>
              <View style={styles.metricsRow}>
                {plan.targetDistance !== null ? (
                  <Chip compact style={styles.metricChip} textStyle={styles.metricChipText}>
                    {`${plan.targetDistance} ${t('cardioPlan.unitKm')}`}
                  </Chip>
                ) : null}
                {plan.targetDuration ? (
                  <Chip compact style={styles.metricChip} textStyle={styles.metricChipText}>
                    {plan.targetDuration}
                  </Chip>
                ) : null}
                {plan.targetZone ? (
                  <Chip compact style={styles.metricChip} textStyle={styles.metricChipText}>
                    {plan.targetZone.toUpperCase()}
                  </Chip>
                ) : null}
                {plan.targetPace ? (
                  <Chip compact style={styles.metricChip} textStyle={styles.metricChipText}>
                    {`${plan.targetPace} ${t('cardioPlan.minPerKm')}`}
                  </Chip>
                ) : null}
              </View>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cardioPlan.doneSection')}
          </Text>

          <Pressable onPress={() => setShowDatePicker(true)}>
            <TextInput
              label={t('cardioPlan.form.performedAt')}
              value={formatDate(form.performedAt)}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
            />
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={parseISODate(form.performedAt)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          ) : null}

          <TextInput
            label={t('cardio.duration')}
            value={form.duration}
            onChangeText={(value) => updateField('duration', value)}
            mode="outlined"
          />
          <TextInput
            label={t('cardio.distance')}
            value={form.distanceKm}
            onChangeText={(value) => updateField('distanceKm', value)}
            mode="outlined"
            keyboardType="decimal-pad"
            right={<TextInput.Affix text={t('cardioPlan.unitKm')} />}
          />
          <TextInput
            label={t('cardio.avgPace')}
            value={form.avgPace}
            onChangeText={(value) => updateField('avgPace', value)}
            mode="outlined"
            placeholder={t('cardioPlan.placeholders.pace')}
          />
          <TextInput
            label={t('cardio.avgHr')}
            value={form.avgHr}
            onChangeText={(value) => updateField('avgHr', value)}
            mode="outlined"
            keyboardType="numeric"
          />

          <View style={styles.chipSection}>
            <Text variant="labelMedium" style={styles.mutedText}>
              {t('cardioPlan.form.targetZone')}
            </Text>
            <View style={styles.metricsRow}>
              {ZONES.map((zone) => (
                <Chip
                  key={zone}
                  selected={form.zone === zone}
                  style={styles.metricChip}
                  selectedColor={colors.textPrimary}
                  onPress={() => updateField('zone', form.zone === zone ? null : zone)}
                >
                  {zone.toUpperCase()}
                </Chip>
              ))}
            </View>
          </View>

          <TextInput
            label={t('cardioPlan.rpe')}
            value={form.perceivedEffort}
            onChangeText={(value) => updateField('perceivedEffort', value)}
            mode="outlined"
            keyboardType="numeric"
            placeholder={t('cardioPlan.placeholders.rpe')}
          />

          <TextInput
            label={t('cardio.notes')}
            value={form.notes}
            onChangeText={(value) => updateField('notes', value)}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.actions}>
          <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving}>
            {t('cardioPlan.saveRecord')}
          </Button>
          <Button mode="text" onPress={() => router.back()} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  plannedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.cardio,
  },
  plannedContent: {
    gap: 8,
  },
  primaryText: {
    color: colors.textPrimary,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricChipText: {
    color: colors.textSecondary,
  },
  chipSection: {
    gap: 8,
  },
  actions: {
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
});
