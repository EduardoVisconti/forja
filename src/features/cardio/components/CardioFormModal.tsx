import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { TRAINING_TYPES, CARDIO_ZONES, cardioSchema, type CardioFormValues } from '../schemas/cardioSchemas';
import type { CardioLog } from '../types';

interface Props {
  visible: boolean;
  unit: 'kg' | 'lbs';
  initial: CardioLog | null;
  onSubmit: (values: CardioFormValues) => void;
  onDismiss: () => void;
}

const KM_TO_MILES = 0.621371;

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
  } = useForm<CardioFormValues>({
    resolver: zodResolver(cardioSchema),
    mode: 'onSubmit',
    defaultValues: {
      date: todayISO(),
      trainingType: null,
      zone: null,
      durationMinutes: 30,
      distance: 0,
      avgPace: '',
      avgHr: null,
      notes: '',
    },
  });

  useEffect(() => {
    if (!visible) return;

    if (initial) {
      const displayDistance = isImperial
        ? parseFloat((initial.distanceKm * KM_TO_MILES).toFixed(2))
        : initial.distanceKm;

      reset({
        date: initial.date,
        trainingType: initial.trainingType,
        zone: initial.zone,
        durationMinutes: initial.durationMinutes,
        distance: displayDistance,
        avgPace: initial.avgPace,
        avgHr: initial.avgHr,
        notes: initial.notes,
      });
    } else {
      reset({
        date: todayISO(),
        trainingType: null,
        zone: null,
        durationMinutes: 30,
        distance: 0,
        avgPace: '',
        avgHr: null,
        notes: '',
      });
    }
  }, [visible, initial, isImperial, reset]);

  const handleSave = (values: CardioFormValues) => {
    const distanceKm = isImperial ? values.distance / KM_TO_MILES : values.distance;
    onSubmit({ ...values, distance: distanceKm });
  };

  const distanceLabel = isImperial ? t('cardio.distanceMi') : t('cardio.distanceKm');
  const paceLabel = isImperial ? t('cardio.pacePerMile') : t('cardio.pacePerKm');

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>
          {initial ? t('cardio.editEntry') : t('cardio.newEntry')}
        </Dialog.Title>
        <Dialog.Content style={styles.contentWrapper}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      label={t('cardio.date')}
                      value={formatDDMMYYYY(value)}
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                    />
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={parseISODate(value)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          const iso = selectedDate.toISOString().split('T')[0];
                          onChange(iso);
                        }
                      }}
                    />
                  )}
                  {errors.date && (
                    <HelperText type="error">{t(errors.date.message ?? '')}</HelperText>
                  )}
                </>
              )}
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
                  name="durationMinutes"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <TextInput
                        label={t('cardio.duration')}
                        value={String(value)}
                        onChangeText={(v) => onChange(parseInt(v, 10) || 0)}
                        keyboardType="numeric"
                        mode="outlined"
                      />
                      {errors.durationMinutes && (
                        <HelperText type="error">
                          {t(errors.durationMinutes.message ?? '')}
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
                      <TextInput
                        label={distanceLabel}
                        value={String(value)}
                        onChangeText={(v) => onChange(parseFloat(v) || 0)}
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
                      <TextInput
                        label={paceLabel}
                        value={value}
                        onChangeText={onChange}
                        placeholder="5:30"
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
                      <TextInput
                        label={t('cardio.avgHr')}
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
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button mode="contained" onPress={handleSubmit(handleSave)}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    dialog: {
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      maxHeight: '90%',
    },
    title: { paddingHorizontal: 16 },
    contentWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
    content: { paddingVertical: 4 },
    actions: { paddingHorizontal: 16, paddingBottom: 0, marginBottom: 0 },
    input: { marginBottom: 8 },
    sectionLabel: { marginTop: 8, marginBottom: 4, color: theme.colors.onSurfaceVariant },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {},
    row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    half: { flex: 1 },
  });
