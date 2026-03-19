import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { HabitConfig } from '../types';

interface Props {
  visible: boolean;
  configs: HabitConfig[];
  onSave: (configs: HabitConfig[]) => void;
  onDismiss: () => void;
}

export function HabitConfigModal({ visible, configs, onSave, onDismiss }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<HabitConfig[]>([]);

  useEffect(() => {
    if (visible) {
      setEditing(configs.map((c) => ({ ...c })));
    }
  }, [visible, configs]);

  const updateHabit = (habitId: string, updates: Partial<HabitConfig>) => {
    setEditing((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
    );
  };

  const handleSave = () => {
    onSave(editing);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{t('habits.config.title')}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
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
                  onValueChange={(v) => updateHabit(habit.id, { active: v })}
                />
              </View>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
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
  dialog: { maxHeight: '90%' },
  scrollArea: { paddingHorizontal: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  emoji: { fontSize: 24 },
  input: { flex: 1 },
});
