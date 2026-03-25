import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exerciseSchema, type ExerciseFormValues } from '../schemas/workoutSchemas';
import type { Exercise, UserPreferences } from '../types';

const KG_TO_LBS = 2.205;

/** Convert kg → display unit for form pre-fill */
function toDisplayWeight(kg: number, unit: UserPreferences['unit']): string {
  if (unit === 'lbs') return (kg * KG_TO_LBS).toFixed(1);
  return String(kg);
}

/** Convert display unit → kg for storage */
function toStorageKg(displayValue: number, unit: UserPreferences['unit']): number {
  if (unit === 'lbs') return Math.round((displayValue / KG_TO_LBS) * 10) / 10;
  return displayValue;
}

interface ExerciseFormModalProps {
  visible: boolean;
  unit: UserPreferences['unit'];
  initial?: Exercise | null;
  onSubmit: (data: Omit<Exercise, 'id' | 'templateId' | 'orderIndex'>) => Promise<void>;
  onDismiss: () => void;
}

export function ExerciseFormModal({
  visible,
  unit,
  initial,
  onSubmit,
  onDismiss,
}: ExerciseFormModalProps) {
  const { t } = useTranslation();
  const styles = createStyles();
  const isEditing = !!initial;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60, notes: '' },
  });

  useEffect(() => {
    if (visible) {
      if (initial) {
        reset({
          name: initial.name,
          sets: initial.sets,
          reps: initial.reps,
          weight: parseFloat(toDisplayWeight(initial.weight, unit)),
          restSeconds: initial.restSeconds,
          notes: initial.notes,
        });
      } else {
        reset({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60, notes: '' });
      }
    }
  }, [visible, initial, unit, reset]);

  const handleConfirm = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      sets: values.sets,
      reps: values.reps,
      weight: toStorageKg(values.weight, unit),
      restSeconds: values.restSeconds,
      notes: values.notes ?? '',
    });
    onDismiss();
  });

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ borderRadius: 16, backgroundColor: '#141414' }}
      >
        <Dialog.Title>
          {isEditing ? t('exercise.editExercise') : t('exercise.newExercise')}
        </Dialog.Title>

        <Dialog.Content style={{ backgroundColor: 'transparent' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ backgroundColor: 'transparent' }}
              contentContainerStyle={styles.fields}
            >
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label={t('exercise.name')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    mode="outlined"
                    autoFocus
                    autoCorrect={true}
                    autoCapitalize="words"
                    spellCheck={true}
                    returnKeyType="next"
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name?.message ? t(errors.name.message) : ''}
              </HelperText>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Controller
                    control={control}
                    name="sets"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label={t('exercise.sets')}
                        value={String(value)}
                        onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                        onBlur={onBlur}
                        error={!!errors.sets}
                        keyboardType="number-pad"
                        mode="outlined"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <HelperText type="error" visible={!!errors.sets}>
                    {errors.sets?.message ? t(errors.sets.message) : ''}
                  </HelperText>
                </View>

                <View style={styles.half}>
                  <Controller
                    control={control}
                    name="reps"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label={t('exercise.reps')}
                        value={String(value)}
                        onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                        onBlur={onBlur}
                        error={!!errors.reps}
                        keyboardType="number-pad"
                        mode="outlined"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <HelperText type="error" visible={!!errors.reps}>
                    {errors.reps?.message ? t(errors.reps.message) : ''}
                  </HelperText>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Controller
                    control={control}
                    name="weight"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label={`${t('exercise.weight')} (${unit})`}
                        value={String(value)}
                        onChangeText={(text) => onChange(parseFloat(text) || 0)}
                        onBlur={onBlur}
                        error={!!errors.weight}
                        keyboardType="decimal-pad"
                        mode="outlined"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <HelperText type="error" visible={!!errors.weight}>
                    {errors.weight?.message ? t(errors.weight.message) : ''}
                  </HelperText>
                </View>

                <View style={styles.half}>
                  <Controller
                    control={control}
                    name="restSeconds"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label={t('exercise.restSeconds')}
                        value={String(value)}
                        onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                        onBlur={onBlur}
                        error={!!errors.restSeconds}
                        keyboardType="number-pad"
                        mode="outlined"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <HelperText type="error" visible={!!errors.restSeconds}>
                    {errors.restSeconds?.message ? t(errors.restSeconds.message) : ''}
                  </HelperText>
                </View>
              </View>

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label={t('exercise.notes')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.notes}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                )}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog.Content>

        <Dialog.Actions
          style={{
            backgroundColor: '#141414',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            paddingBottom: 8,
          }}
        >
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const createStyles = () =>
  StyleSheet.create({
    fields: {
      paddingTop: 4,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    half: {
      flex: 1,
    },
  });
