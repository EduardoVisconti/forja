import { StyleSheet, View } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

interface Props {
  habitId: string;
  label: string;
  emoji: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (habitId: string, value: boolean) => void;
}

export function HabitToggleItem({ habitId, label, emoji, checked, disabled, onToggle }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

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

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    disabled: { opacity: 0.5 },
    icon: { fontSize: 22, marginRight: 12 },
    label: { flex: 1, color: theme.colors.onSurface },
  });
