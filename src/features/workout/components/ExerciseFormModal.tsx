import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exerciseSchema, type ExerciseFormValues } from '../schemas/workoutSchemas';
import type { Exercise, UserPreferences } from '../types';

const KG_TO_LBS = 2.20462;

function convertWeight(
  value: number,
  fromUnit: Exercise['weightUnit'],
  toUnit: UserPreferences['unit'],
): number {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'kg' ? value * KG_TO_LBS : value / KG_TO_LBS;
}

function toDisplayWeight(
  weight: number,
  storedUnit: Exercise['weightUnit'],
  displayUnit: UserPreferences['unit'],
): string {
  if (storedUnit === displayUnit) return String(weight);
  const converted = convertWeight(weight, storedUnit, displayUnit);
  return (Math.round(converted * 10) / 10).toFixed(1);
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
    defaultValues: { name: '', sets: 3, reps: '10', weight: 0, restSeconds: 60, notes: '' },
  });

  useEffect(() => {
    if (visible) {
      if (initial) {
        reset({
          name: initial.name,
          sets: initial.sets,
          reps: initial.reps,
          weight: parseFloat(toDisplayWeight(initial.weight, initial.weightUnit, unit)),
          restSeconds: initial.restSeconds,
          notes: initial.notes,
        });
      } else {
        reset({ name: '', sets: 3, reps: '10', weight: 0, restSeconds: 60, notes: '' });
      }
    }
  }, [visible, initial, unit, reset]);

  const handleConfirm = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      sets: values.sets,
      reps: values.reps,
      weight: values.weight,
      weightUnit: unit,
      restSeconds: values.restSeconds,
      notes: values.notes ?? '',
    });
    onDismiss();
  });

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
            <Text variant="headlineSmall">
              {isEditing ? t('exercise.editExercise') : t('exercise.newExercise')}
            </Text>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.reps}
                      keyboardType="default"
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
          <View style={styles.actions}>
            <Button onPress={onDismiss}>{t('common.cancel')}</Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {t('common.save')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = () =>
  StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: '#141414',
    },
    modalContainer: {
      flex: 1,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      backgroundColor: '#141414',
      overflow: 'hidden',
    },
    titleContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    fields: {
      padding: 16,
      paddingBottom: 40,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    half: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      gap: 8,
      backgroundColor: '#141414',
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
    },
  });
