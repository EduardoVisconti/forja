import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import {
  TRAINING_TYPES,
  CARDIO_ZONES,
  cardioSchema,
  type CardioFormValues,
  type CardioSchemaValues,
} from '../schemas/cardioSchemas';
import type { CardioLog } from '../types';

interface Props {
  visible: boolean;
  unit: 'kg' | 'lbs';
  initial: CardioLog | null;
  onSubmit: (values: CardioFormValues) => void;
  onDismiss: () => void;
}

type CardioFormModalValues = Omit<CardioSchemaValues, 'distance'> & {
  distance: string;
};

const KM_TO_MILES = 0.621371;
const cardioFormResolver = zodResolver(cardioSchema);
const resolveCardioForm: Resolver<CardioFormModalValues> = async (values, context, options) => {
  const parsedDistance = parseFloat(String(values.distance));
  const result = await cardioFormResolver(
    {
      ...values,
      distance: Number.isFinite(parsedDistance) ? parsedDistance : 0,
    },
    context,
    options as unknown as Parameters<typeof cardioFormResolver>[2],
  );

  return {
    values: result.values
      ? {
          ...result.values,
          distance: String(result.values.distance),
        }
      : {},
    errors: result.errors,
  };
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function CardioFormModal({ visible, unit, initial, onSubmit, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const isImperial = unit === 'lbs';
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardioFormModalValues>({
    resolver: resolveCardioForm,
    mode: 'onSubmit',
    defaultValues: {
      date: todayISO(),
      trainingType: null,
      zone: null,
      duration: '30',
      distance: '0',
      avgPace: '',
      avgHr: null,
      notes: '',
    },
  });

  useEffect(() => {
    if (!visible) return;
    setShowDatePicker(false);

    if (initial) {
      const displayDistance = isImperial
        ? parseFloat((initial.distanceKm * KM_TO_MILES).toFixed(2))
        : initial.distanceKm;

      reset({
        date: initial.date,
        trainingType: initial.trainingType,
        zone: initial.zone,
        duration: initial.duration,
        distance: String(displayDistance),
        avgPace: initial.avgPace,
        avgHr: initial.avgHr,
        notes: initial.notes,
      });
    } else {
      reset({
        date: todayISO(),
        trainingType: null,
        zone: null,
        duration: '30',
        distance: '0',
        avgPace: '',
        avgHr: null,
        notes: '',
      });
    }
  }, [visible, initial, isImperial, reset]);

  const handleSave = (data: CardioFormModalValues) => {
    const distance = parseFloat(String(data.distance));
    const normalizedDistance = Number.isFinite(distance) ? distance : 0;
    const distanceKm = isImperial ? normalizedDistance / KM_TO_MILES : normalizedDistance;
    onSubmit({ ...data, duration: data.duration.trim(), distance: distanceKm });
  };

  const paceLabel = isImperial ? t('cardio.pacePerMile') : t('cardio.pacePerKm');
  const modalTitle = initial ? t('cardio.editEntry') : t('cardio.newEntry');

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
            <Text style={styles.modalTitle}>{modalTitle}</Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field }) => {
                const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    const iso = selectedDate.toISOString().split('T')[0];
                    field.onChange(iso);
                  }
                };

                return (
                  <>
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <TextInput
                        label={t('cardio.date')}
                        value={formatDDMMYYYY(field.value)}
                        mode="outlined"
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                      />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={parseISODate(field.value)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                      />
                    )}
                    {errors.date && (
                      <HelperText type="error">{t(errors.date.message ?? '')}</HelperText>
                    )}
                  </>
                );
              }}
            />

            {/* Training Type */}
            <Text variant="labelMedium" style={styles.sectionLabel}>
              {t('cardio.trainingType.label')} ({t('cardio.optional')})
            </Text>
            <Controller
              control={control}
              name="trainingType"
              render={({ field: { value, onChange } }) => (
                <View style={styles.chipRow}>
                  {TRAINING_TYPES.map((type) => (
                    <Chip
                      key={type}
                      selected={value === type}
                      onPress={() => onChange(value === type ? null : type)}
                      style={styles.chip}
                      compact
                    >
                      {t(`cardio.trainingType.${type}`)}
                    </Chip>
                  ))}
                </View>
              )}
            />

            {/* Zone */}
            <Text variant="labelMedium" style={styles.sectionLabel}>
              {t('cardio.zone.label')} ({t('cardio.optional')})
            </Text>
            <Controller
              control={control}
              name="zone"
              render={({ field: { value, onChange } }) => (
                <View style={styles.chipRow}>
                  {CARDIO_ZONES.map((z) => (
                    <Chip
                      key={z}
                      selected={value === z}
                      onPress={() => onChange(value === z ? null : z)}
                      style={styles.chip}
                      compact
                    >
                      {t(`cardio.zone.${z}`)}
                    </Chip>
                  ))}
                </View>
              )}
            />

            {errors.trainingType && (
              <HelperText type="error">{t(errors.trainingType.message ?? '')}</HelperText>
            )}

            {/* Duration + Distance */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Controller
                  control={control}
                  name="duration"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                        {t('cardio.duration')}
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="default"
                        mode="outlined"
                      />
                      <Text variant="bodySmall" style={styles.durationHint}>
                        {t('cardio.durationHint')}
                      </Text>
                      {errors.duration && (
                        <HelperText type="error">
                          {t(errors.duration.message ?? '')}
                        </HelperText>
                      )}
                    </>
                  )}
                />
              </View>
              <View style={styles.half}>
                <Controller
                  control={control}
                  name="distance"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                        {t('cardio.distance')}
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                        mode="outlined"
                      />
                      {errors.distance && (
                        <HelperText type="error">
                          {t(errors.distance.message ?? '')}
                        </HelperText>
                      )}
                    </>
                  )}
                />
              </View>
            </View>

            {/* Pace + HR */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Controller
                  control={control}
                  name="avgPace"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Text variant="labelMedium" style={styles.fieldLabel}>
                        {t('cardio.avgPace')}
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder={paceLabel}
                        mode="outlined"
                      />
                      {errors.avgPace && (
                        <HelperText type="error">
                          {t(errors.avgPace.message ?? '')}
                        </HelperText>
                      )}
                    </>
                  )}
                />
              </View>
              <View style={styles.half}>
                <Controller
                  control={control}
                  name="avgHr"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Text variant="labelMedium" style={styles.fieldLabel}>
                        {t('cardio.avgHr')}
                      </Text>
                      <TextInput
                        value={value !== null ? String(value) : ''}
                        onChangeText={(v) => onChange(v ? parseInt(v, 10) : null)}
                        keyboardType="numeric"
                        mode="outlined"
                        placeholder={t('cardio.optional')}
                      />
                      {errors.avgHr && (
                        <HelperText type="error">
                          {t(errors.avgHr.message ?? '')}
                        </HelperText>
                      )}
                    </>
                  )}
                />
              </View>
            </View>

            {/* Notes */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { value, onChange } }) => (
                <>
                  <TextInput
                    label={t('cardio.notes')}
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    placeholder={t('cardio.optional')}
                    style={styles.input}
                  />
                  {errors.notes && (
                    <HelperText type="error">{t(errors.notes.message ?? '')}</HelperText>
                  )}
                </>
              )}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Button onPress={onDismiss}>{t('common.cancel')}</Button>
            <Button mode="contained" onPress={handleSubmit(handleSave)}>
              {t('common.save')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
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
      padding: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    input: { marginBottom: 8 },
    durationHint: { marginTop: 4, color: theme.colors.onSurfaceVariant },
    sectionLabel: { marginTop: 8, marginBottom: 4, color: theme.colors.onSurfaceVariant },
    fieldLabel: { marginBottom: 4, color: theme.colors.onSurfaceVariant },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {},
    row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    half: { flex: 1 },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      gap: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
