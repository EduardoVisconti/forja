import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dialogActionsStyle, modalStyle } from '@/core/theme/tokens';
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
      <Dialog visible={visible} onDismiss={onDismiss} style={modalStyle}>
        <Dialog.Title>
          {isEditing ? t('workout.editTemplate') : t('workout.newTemplate')}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
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
                  label={t('workout.templateName')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.name}
                  mode="outlined"
                  autoFocus
                  autoCorrect={true}
                  autoCapitalize="words"
                  spellCheck={true}
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
                  <View style={styles.typeChipList}>
                    <Chip selected={value === 'gym'} onPress={() => onChange('gym')}>
                      {t('workout.type.gym')}
                    </Chip>
                    <Chip selected={value === 'stability'} onPress={() => onChange('stability')}>
                      {t('workout.type.stability')}
                    </Chip>
                    <Chip
                      selected={value === 'flexibility'}
                      onPress={() => onChange('flexibility')}
                    >
                      {t('workout.type.flexibility')}
                    </Chip>
                    <Chip selected={value === 'warmup'} onPress={() => onChange('warmup')}>
                      {t('workout.type.warmup')}
                    </Chip>
                    <Chip selected={value === 'cardio'} onPress={() => onChange('cardio')}>
                      {t('workout.type.cardio')}
                    </Chip>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions style={dialogActionsStyle}>
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
  content: {
    backgroundColor: 'transparent',
  },
  fields: {
    paddingBottom: 16,
  },
  typeRow: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  typeChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorRow: {
    marginTop: 2,
    backgroundColor: 'transparent',
  },
});
