import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { HabitKey } from '../types';

const HABIT_ICONS: Record<HabitKey, string> = {
  sun_exposure: '☀️',
  sleep_7h: '😴',
  water: '💧',
  no_late_caffeine: '☕',
  ate_healthy: '🥗',
  exercised: '🏋️',
  read: '📖',
  digital_balance: '📵',
};

interface Props {
  habitKey: HabitKey;
  checked: boolean;
  disabled: boolean;
  onToggle: (key: HabitKey, value: boolean) => void;
}

export function HabitToggleItem({ habitKey, checked, disabled, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <Text style={styles.icon}>{HABIT_ICONS[habitKey]}</Text>
      <Text style={styles.label} variant="bodyLarge">
        {t(`habits.${habitKey}`)}
      </Text>
      <Switch
        value={checked}
        disabled={disabled}
        onValueChange={(v) => onToggle(habitKey, v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  disabled: { opacity: 0.5 },
  icon: { fontSize: 22, marginRight: 12 },
  label: { flex: 1, color: '#111827' },
});
