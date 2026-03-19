import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, SegmentedButtons, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { templateSchema, type TemplateFormValues } from '../schemas/workoutSchemas';
import type { WorkoutTemplate } from '../types';

interface TemplateFormModalProps {
  visible: boolean;
  initial?: Pick<WorkoutTemplate, 'name' | 'type'> | null;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
  onDismiss: () => void;
}

export function TemplateFormModal({
  visible,
  initial,
  onSubmit,
  onDismiss,
}: TemplateFormModalProps) {
  const { t } = useTranslation();
  const isEditing = !!initial;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', type: 'gym' },
  });

  useEffect(() => {
    if (visible) {
      reset(initial ?? { name: '', type: 'gym' });
    }
  }, [visible, initial, reset]);

  const handleConfirm = handleSubmit(async (values) => {
    await onSubmit(values);
    onDismiss();
  });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          {isEditing ? t('workout.editTemplate') : t('workout.newTemplate')}
        </Dialog.Title>
        <Dialog.Content>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('workout.templateName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.name}
                mode="outlined"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
            )}
          />
          {errors.name ? (
            <View style={styles.errorRow}>
              <Button textColor="#ef4444" compact>
                {t(errors.name.message ?? 'workout.errors.nameRequired')}
              </Button>
            </View>
          ) : null}

          <View style={styles.typeRow}>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <SegmentedButtons
                  value={value}
                  onValueChange={onChange}
                  buttons={[
                    { value: 'gym', label: t('workout.type.gym') },
                    { value: 'cardio', label: t('workout.type.cardio') },
                  ]}
                />
              )}
            />
          </View>
        </Dialog.Content>

        <Dialog.Actions>
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

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  typeRow: {
    marginTop: 16,
  },
  errorRow: {
    marginTop: 2,
  },
});
