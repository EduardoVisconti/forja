import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';

interface Props {
  habitId: string;
  label: string;
  emoji: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (habitId: string, value: boolean) => void;
}

export function HabitToggleItem({ habitId, label, emoji, checked, disabled, onToggle }: Props) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <Text style={styles.icon}>{emoji}</Text>
      <Text style={styles.label} variant="bodyLarge">
        {label}
      </Text>
      <Switch
        value={checked}
        disabled={disabled}
        onValueChange={(v) => onToggle(habitId, v)}
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
