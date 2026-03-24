import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { dialogActionsStyle, modalStyle } from '@/core/theme/tokens';
import type { HabitConfig } from '../types';

const EMOJI_PRESETS = ['💪', '😴', '💧', '☀️', '🥗', '📖', '📵', '🏃', '🧘', '❤️'] as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface Props {
  visible: boolean;
  configs: HabitConfig[];
  onSave: (configs: HabitConfig[]) => void;
  onDismiss: () => void;
}

export function HabitConfigModal({ visible, configs, onSave, onDismiss }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<HabitConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState<(typeof EMOJI_PRESETS)[number]>(EMOJI_PRESETS[0]);

  useEffect(() => {
    if (visible) {
      setEditing(configs.map((c) => ({ ...c })));
      setShowAddForm(false);
      setNewLabel('');
      setNewEmoji(EMOJI_PRESETS[0]);
    }
  }, [visible, configs]);

  const updateHabit = (habitId: string, updates: Partial<HabitConfig>) => {
    setEditing((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
    );
  };

  const handleDeleteHabit = (habitId: string, habitLabel: string) => {
    Alert.alert(t('habits.config.deleteTitle'), t('habits.config.deleteMessage', { label: habitLabel }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => setEditing((prev) => prev.filter((h) => h.id !== habitId)),
      },
    ]);
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    setNewLabel('');
    setNewEmoji(EMOJI_PRESETS[0]);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewLabel('');
    setNewEmoji(EMOJI_PRESETS[0]);
  };

  const handleSaveAdd = () => {
    const label = newLabel.trim();
    if (!label) return;

    const next: HabitConfig = {
      id: generateId(),
      label,
      emoji: newEmoji,
      active: true,
    };

    setEditing((prev) => [...prev, next]);
    setShowAddForm(false);
    setNewLabel('');
    setNewEmoji(EMOJI_PRESETS[0]);
  };

  const handleSave = () => {
    onSave(editing);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={modalStyle}>
        <Dialog.Title>{t('habits.config.title')}</Dialog.Title>
        <Dialog.ScrollArea style={{ backgroundColor: 'transparent', paddingHorizontal: 0, maxHeight: 400 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16 }}>
            {editing.map((habit) => (
              <View key={habit.id} style={styles.row}>
                <Text style={styles.emoji}>{habit.emoji}</Text>
                <TextInput
                  value={habit.label}
                  onChangeText={(text) => updateHabit(habit.id, { label: text })}
                  placeholder={t('habits.config.labelPlaceholder')}
                  mode="outlined"
                  dense
                  style={styles.input}
                />
                <Switch
                  value={habit.active}
                  onValueChange={(value) => updateHabit(habit.id, { active: value })}
                />
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  onPress={() => handleDeleteHabit(habit.id, habit.label)}
                  style={styles.deleteBtn}
                  accessibilityLabel={t('habits.config.deleteTitle')}
                />
              </View>
            ))}

            <View style={styles.addSection}>
              {!showAddForm ? (
                <Button mode="outlined" icon="plus" onPress={handleOpenAddForm} style={styles.addBtn}>
                  {t('habits.config.addHabit')}
                </Button>
              ) : (
                <View style={styles.addForm}>
                  <View style={styles.emojiPicker}>
                    {EMOJI_PRESETS.map((emoji) => (
                      <Pressable
                        key={emoji}
                        onPress={() => setNewEmoji(emoji)}
                        style={[styles.emojiOption, newEmoji === emoji && styles.emojiOptionSelected]}
                        accessibilityRole="button"
                        accessibilityLabel={emoji}
                      >
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    value={newLabel}
                    onChangeText={setNewLabel}
                    placeholder={t('habits.config.labelPlaceholder')}
                    mode="outlined"
                    dense
                    style={styles.addInput}
                  />

                  <View style={styles.addFormActions}>
                    <Button onPress={handleCancelAdd}>{t('common.cancel')}</Button>
                    <Button mode="contained" onPress={handleSaveAdd} disabled={!newLabel.trim()}>
                      {t('common.save')}
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={dialogActionsStyle}>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button mode="contained" onPress={handleSave}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  emoji: { fontSize: 24 },
  input: { flex: 1 },
  deleteBtn: { margin: 0 },
  addSection: { padding: 16, paddingTop: 8 },
  addBtn: { alignSelf: 'stretch' },
  addForm: { gap: 12 },
  emojiPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  emojiOptionSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  emojiOptionText: { fontSize: 18 },
  addInput: { marginTop: 2 },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
