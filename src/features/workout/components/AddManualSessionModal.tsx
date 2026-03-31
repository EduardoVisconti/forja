import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, HelperText, IconButton, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { WorkoutTemplate } from '../types';

interface Props {
  visible: boolean;
  templates: WorkoutTemplate[];
  isSaving?: boolean;
  onSave: (template: WorkoutTemplate, date: string) => Promise<void> | void;
  onDismiss: () => void;
}

const TEMPLATE_TYPE_LABEL_KEY: Record<WorkoutTemplate['type'], string> = {
  gym: 'workout.type.gym',
  cardio: 'workout.type.cardio',
  functional: 'workout.type.functional',
};

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toISODate(yesterday);
}

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function AddManualSessionModal({
  visible,
  templates,
  isSaving = false,
  onSave,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [date, setDate] = useState<string>(getYesterdayISO);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!visible) return;
    setDate(getYesterdayISO());
    setSelectedTemplateId(null);
    setTemplateError(null);
    setShowDatePicker(false);
  }, [visible]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;
    setDate(toISODate(selectedDate));
  };

  const handleSave = async () => {
    if (!selectedTemplate) {
      setTemplateError(t('workout.history.selectTemplate'));
      return;
    }

    await onSave(selectedTemplate, date);
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="headlineSmall">{t('workout.history.addManual')}</Text>
          </View>

          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.dateSection}>
                <Text variant="labelMedium" style={styles.label}>
                  {t('workout.history.selectDate')}
                </Text>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    mode="outlined"
                    editable={false}
                    value={formatDate(date)}
                    right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                  />
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={parseISODate(date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                ) : null}

                <Text variant="labelMedium" style={styles.label}>
                  {t('workout.history.selectTemplate')}
                </Text>
                {templateError ? <HelperText type="error">{templateError}</HelperText> : null}
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyTemplates}>{t('workout.emptyHint')}</Text>
            }
            renderItem={({ item }) => {
              const selected = selectedTemplateId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.templateItem, selected ? styles.templateItemSelected : null]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setTemplateError(null);
                    setSelectedTemplateId(item.id);
                  }}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{t(TEMPLATE_TYPE_LABEL_KEY[item.type])}</Text>
                    </View>
                  </View>
                  {selected ? (
                    <IconButton icon="check-circle" size={18} iconColor="#8b5cf6" style={styles.checkmark} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.actions}>
            <Button onPress={onDismiss} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving}>
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
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  dateSection: {
    gap: 8,
    marginBottom: 4,
  },
  label: {
    color: colors.textSecondary,
  },
  templateItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateItemSelected: {
    borderColor: '#8b5cf6',
  },
  templateInfo: {
    flex: 1,
    gap: 6,
  },
  templateName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  checkmark: {
    margin: 0,
    marginLeft: 8,
  },
  emptyTemplates: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 16,
    backgroundColor: colors.surface,
  },
});
