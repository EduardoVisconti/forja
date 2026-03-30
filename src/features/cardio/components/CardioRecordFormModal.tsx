import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { CardioRecord } from '../types/plans';

const TRAINING_TYPES = ['regenerative', 'intervals', 'long', 'strong', 'walk'] as const;
const ZONES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

interface Props {
  visible: boolean;
  initial: CardioRecord | null;
  onSubmit: (values: CardioRecordFormValues) => Promise<void> | void;
  onDismiss: () => void;
}

export interface CardioRecordFormValues {
  planId: string | null;
  activityType: 'running';
  trainingType: string | null;
  performedAt: string;
  duration: string | null;
  distanceKm: number | null;
  avgPace: string | null;
  avgHr: number | null;
  zone: string | null;
  notes: string | null;
  perceivedEffort: number | null;
}

interface FormState {
  performedAt: string;
  trainingType: string | null;
  duration: string;
  distanceKm: string;
  avgPace: string;
  avgHr: string;
  zone: string | null;
  notes: string;
  perceivedEffort: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function resolveTrainingTypeLabel(trainingType: string, t: (key: string) => string): string {
  if (trainingType === 'regenerative') return t('cardio.trainingType.regenerative');
  if (trainingType === 'intervals') return t('cardio.trainingType.intervals');
  if (trainingType === 'long') return t('cardio.trainingType.long');
  if (trainingType === 'strong') return t('cardio.trainingType.strong');
  if (trainingType === 'walk') return t('cardio.trainingType.walk');
  return trainingType;
}

function createInitialState(initial: CardioRecord | null): FormState {
  if (!initial) {
    return {
      performedAt: todayISO(),
      trainingType: null,
      duration: '',
      distanceKm: '',
      avgPace: '',
      avgHr: '',
      zone: null,
      notes: '',
      perceivedEffort: '',
    };
  }

  return {
    performedAt: initial.performedAt,
    trainingType: initial.trainingType,
    duration: initial.duration ?? '',
    distanceKm: initial.distanceKm !== null ? String(initial.distanceKm) : '',
    avgPace: initial.avgPace ?? '',
    avgHr: initial.avgHr !== null ? String(initial.avgHr) : '',
    zone: initial.zone,
    notes: initial.notes ?? '',
    perceivedEffort: initial.perceivedEffort !== null ? String(initial.perceivedEffort) : '',
  };
}

export function CardioRecordFormModal({ visible, initial, onSubmit, onDismiss }: Props) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState<FormState>(() => createInitialState(initial));

  const modalTitle = useMemo(
    () => (initial ? t('cardioPlan.editRecord') : t('cardioPlan.newRecord')),
    [initial, t],
  );

  useEffect(() => {
    if (!visible) return;
    setShowDatePicker(false);
    setForm(createInitialState(initial));
  }, [visible, initial]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'set' || !selectedDate) return;
    updateField('performedAt', selectedDate.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    const distance = parseFloat(form.distanceKm.replace(',', '.'));
    const avgHr = parseInt(form.avgHr, 10);
    const rpe = parseInt(form.perceivedEffort, 10);

    await onSubmit({
      planId: initial?.planId ?? null,
      activityType: 'running',
      trainingType: form.trainingType,
      performedAt: form.performedAt,
      duration: form.duration.trim() || null,
      distanceKm: Number.isFinite(distance) ? distance : null,
      avgPace: form.avgPace.trim() || null,
      avgHr: Number.isFinite(avgHr) ? avgHr : null,
      zone: form.zone,
      notes: form.notes.trim() || null,
      perceivedEffort: Number.isFinite(rpe) ? Math.min(10, Math.max(1, rpe)) : null,
    });
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalContainer}>
          <View style={styles.titleContainer}>
            <Text variant="headlineSmall">{modalTitle}</Text>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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

            <View style={styles.section}>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                {t('cardioPlan.form.trainingType')}
              </Text>
              <View style={styles.chipRow}>
                {TRAINING_TYPES.map((trainingType) => (
                  <Chip
                    key={trainingType}
                    selected={form.trainingType === trainingType}
                    style={styles.chip}
                    selectedColor={colors.textPrimary}
                    onPress={() =>
                      updateField(
                        'trainingType',
                        form.trainingType === trainingType ? null : trainingType,
                      )
                    }
                  >
                    {resolveTrainingTypeLabel(trainingType, t)}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label={t('cardio.duration')}
              value={form.duration}
              onChangeText={(value) => updateField('duration', value)}
              mode="outlined"
              placeholder={t('cardioPlan.placeholders.duration')}
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

            <View style={styles.section}>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                {t('cardioPlan.form.targetZone')}
              </Text>
              <View style={styles.chipRow}>
                {ZONES.map((zone) => (
                  <Chip
                    key={zone}
                    selected={form.zone === zone}
                    style={styles.chip}
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
          </ScrollView>
          <View style={styles.actions}>
            <Button onPress={onDismiss}>{t('common.cancel')}</Button>
            <Button mode="contained" onPress={handleSave}>
              {t('common.save')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
