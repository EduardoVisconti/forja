import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CARDIO_CATEGORIES, cardioSchema, type CardioFormValues } from '../schemas/cardioSchemas';
import type { CardioCategory, CardioLog } from '../types';

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

const ZONE_CATEGORIES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;
const OTHER_CATEGORIES = ['walk', 'regenerative', 'intervals', 'long'] as const;

export function CardioFormModal({ visible, unit, initial, onSubmit, onDismiss }: Props) {
  const { t } = useTranslation();
  const isImperial = unit === 'lbs';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardioFormValues>({
    resolver: zodResolver(cardioSchema),
    defaultValues: {
      date: todayISO(),
      category: 'z2',
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
        category: initial.category,
        durationMinutes: initial.durationMinutes,
        distance: displayDistance,
        avgPace: initial.avgPace,
        avgHr: initial.avgHr,
        notes: initial.notes,
      });
    } else {
      reset({
        date: todayISO(),
        category: 'z2',
        durationMinutes: 30,
        distance: 0,
        avgPace: '',
        avgHr: null,
        notes: '',
      });
    }
  }, [visible, initial, isImperial, reset]);

  const handleSave = (values: CardioFormValues) => {
    // Convert display unit back to km before handing off
    const distanceKm = isImperial ? values.distance / KM_TO_MILES : values.distance;
    onSubmit({ ...values, distance: distanceKm });
  };

  const distanceLabel = isImperial ? t('cardio.distanceMi') : t('cardio.distanceKm');
  const paceLabel = isImperial ? t('cardio.pacePerMile') : t('cardio.pacePerKm');

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          {initial ? t('cardio.editEntry') : t('cardio.newEntry')}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field: { value, onChange } }) => (
                <>
                  <TextInput
                    label={t('cardio.date')}
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    placeholder="AAAA-MM-DD"
                    style={styles.input}
                  />
                  {errors.date && (
                    <HelperText type="error">{t(errors.date.message ?? '')}</HelperText>
                  )}
                </>
              )}
            />

            {/* Category — zones */}
            <Text variant="labelMedium" style={styles.sectionLabel}>
              {t('cardio.category.label')}
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { value, onChange } }) => (
                <>
                  <SegmentedButtons
                    value={value}
                    onValueChange={(v) => onChange(v as CardioCategory)}
                    buttons={ZONE_CATEGORIES.map((cat) => ({
                      value: cat,
                      label: t(`cardio.category.${cat}`),
                    }))}
                    style={styles.input}
                  />
                  <SegmentedButtons
                    value={value}
                    onValueChange={(v) => onChange(v as CardioCategory)}
                    buttons={OTHER_CATEGORIES.map((cat) => ({
                      value: cat,
                      label: t(`cardio.category.${cat}`),
                    }))}
                    style={styles.input}
                  />
                </>
              )}
            />

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
                        keyboardType="numeric"
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
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button mode="contained" onPress={handleSubmit(handleSave)}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { maxHeight: '90%' },
  scrollArea: { paddingHorizontal: 0 },
  input: { marginBottom: 8 },
  sectionLabel: { marginTop: 8, marginBottom: 4, color: '#6b7280' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  half: { flex: 1 },
});
