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
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { CardioPlan } from '../types/plans';

const TRAINING_TYPES = ['regenerative', 'intervals', 'long', 'strong', 'walk'] as const;
const ZONES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

interface Props {
  visible: boolean;
  initial: CardioPlan | null;
  onSubmit: (values: CardioPlanFormValues) => Promise<void> | void;
  onDismiss: () => void;
}

export interface CardioPlanFormValues {
  activityType: 'running';
  title: string;
  plannedDate: string;
  trainingType: string | null;
  targetDistance: number | null;
  targetDuration: string | null;
  targetZone: string | null;
  targetPace: string | null;
  notes: string | null;
}

interface FormState {
  title: string;
  plannedDate: string;
  trainingType: string | null;
  targetDistance: string;
  targetDuration: string;
  targetZone: string | null;
  targetPace: string;
  notes: string;
}

function toLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayISO(): string {
  return toLocalDateISO(new Date());
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

function createInitialState(initial: CardioPlan | null): FormState {
  if (!initial) {
    return {
      title: '',
      plannedDate: todayISO(),
      trainingType: null,
      targetDistance: '',
      targetDuration: '',
      targetZone: null,
      targetPace: '',
      notes: '',
    };
  }

  return {
    title: initial.title,
    plannedDate: initial.plannedDate,
    trainingType: initial.trainingType,
    targetDistance: initial.targetDistance !== null ? String(initial.targetDistance) : '',
    targetDuration: initial.targetDuration ?? '',
    targetZone: initial.targetZone,
    targetPace: initial.targetPace ?? '',
    notes: initial.notes ?? '',
  };
}

export function CardioPlanFormModal({ visible, initial, onSubmit, onDismiss }: Props) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState<FormState>(() => createInitialState(initial));
  const [titleError, setTitleError] = useState<string | null>(null);

  const modalTitle = useMemo(
    () => (initial ? t('cardioPlan.editPlan') : t('cardioPlan.newPlan')),
    [initial, t],
  );

  useEffect(() => {
    if (!visible) return;
    setShowDatePicker(false);
    setTitleError(null);
    setForm(createInitialState(initial));
  }, [initial, visible]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'set' || !selectedDate) return;
    updateField('plannedDate', toLocalDateISO(selectedDate));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    if (!title) {
      setTitleError(t('cardioPlan.errors.titleRequired'));
      return;
    }

    const parsedDistance = parseFloat(form.targetDistance.replace(',', '.'));
    const targetDistance = Number.isFinite(parsedDistance) ? parsedDistance : null;
    const payload: CardioPlanFormValues = {
      activityType: 'running',
      title,
      plannedDate: form.plannedDate,
      trainingType: form.trainingType,
      targetDistance,
      targetDuration: form.targetDuration.trim() || null,
      targetZone: form.targetZone,
      targetPace: form.targetPace.trim() || null,
      notes: form.notes.trim() || null,
    };

    await onSubmit(payload);
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
            <TextInput
              label={t('cardioPlan.form.title')}
              value={form.title}
              onChangeText={(value) => {
                setTitleError(null);
                updateField('title', value);
              }}
              mode="outlined"
              autoFocus
            />
            {titleError ? <HelperText type="error">{titleError}</HelperText> : null}

            <Pressable onPress={() => setShowDatePicker(true)}>
              <TextInput
                label={t('cardioPlan.form.plannedDate')}
                value={formatDate(form.plannedDate)}
                mode="outlined"
                editable={false}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
              />
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={parseISODate(form.plannedDate)}
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
              label={t('cardioPlan.form.targetDistance')}
              value={form.targetDistance}
              onChangeText={(value) => updateField('targetDistance', value)}
              mode="outlined"
              keyboardType="decimal-pad"
              right={<TextInput.Affix text={t('cardioPlan.unitKm')} />}
            />

            <TextInput
              label={t('cardioPlan.form.targetDuration')}
              value={form.targetDuration}
              onChangeText={(value) => updateField('targetDuration', value)}
              mode="outlined"
              placeholder={t('cardioPlan.placeholders.duration')}
            />

            <View style={styles.section}>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                {t('cardioPlan.form.targetZone')}
              </Text>
              <View style={styles.chipRow}>
                {ZONES.map((zone) => (
                  <Chip
                    key={zone}
                    selected={form.targetZone === zone}
                    style={styles.chip}
                    selectedColor={colors.textPrimary}
                    onPress={() => updateField('targetZone', form.targetZone === zone ? null : zone)}
                  >
                    {zone.toUpperCase()}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label={t('cardioPlan.form.targetPace')}
              value={form.targetPace}
              onChangeText={(value) => updateField('targetPace', value)}
              mode="outlined"
              placeholder={t('cardioPlan.placeholders.pace')}
            />

            <TextInput
              label={t('cardioPlan.form.notes')}
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
