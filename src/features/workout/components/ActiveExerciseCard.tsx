import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SessionExercise } from '../types/session';
import type { UserPreferences } from '../types/index';

interface Props {
  exercise: SessionExercise;
  currentSet: number;
  restTimerEnabled: boolean;
  onToggleRestTimer: () => void;
  preferences: UserPreferences;
  onCompleteSet: (reps: number, weightValue: number) => void;
  onSkip: () => void;
  hideActions?: boolean;
}

export function ActiveExerciseCard({
  exercise,
  currentSet,
  restTimerEnabled,
  onToggleRestTimer,
  preferences,
  onCompleteSet,
  onSkip,
  hideActions = false,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [reps, setReps] = useState(String(exercise.reps));
  const [weight, setWeight] = useState(() => {
    const stored = exercise.weight;
    const storedUnit = (exercise as any).weightUnit ?? 'kg';
    const displayUnit = preferences.unit;

    if (storedUnit === displayUnit) return String(stored);
    if (displayUnit === 'lbs') return String(Math.round(stored * 2.20462 * 10) / 10);
    return String(Math.round((stored / 2.20462) * 10) / 10);
  });

  useEffect(() => {
    setReps(String(exercise.reps));
  }, [exercise.id, exercise.reps]);

  useEffect(() => {
    const stored = exercise.weight;
    const storedUnit = (exercise as any).weightUnit ?? 'kg';
    const displayUnit = preferences.unit;

    let converted: string;
    if (storedUnit === displayUnit) {
      converted = String(stored);
    } else if (displayUnit === 'lbs') {
      converted = String(Math.round(stored * 2.20462 * 10) / 10);
    } else {
      converted = String(Math.round((stored / 2.20462) * 10) / 10);
    }
    setWeight(converted);
  }, [exercise.id, exercise.weight, exercise.weightUnit, preferences.unit]);

  const handleCompleteSet = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (isNaN(repsNum) || isNaN(weightNum)) return;
    onCompleteSet(repsNum, weightNum);
  };

  const handleInfo = async () => {
    const query = encodeURIComponent(exercise.name);
    const url = `https://www.google.com/search?q=${query}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t('common.error'), t('session.cannotOpenUrl'));
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={exercise.name}
        subtitle={
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText}>
              {t('session.setProgress', { current: currentSet, total: exercise.sets })}
            </Text>
            {restTimerEnabled ? null : (
              <Pressable
                onPress={onToggleRestTimer}
                style={styles.restOffChip}
                accessibilityRole="button"
                accessibilityLabel={t('session.enableRest')}
              >
                <MaterialCommunityIcons
                  name="timer-off-outline"
                  size={14}
                  color="#9ca3af"
                  style={styles.restOffIcon}
                />
                <Text style={styles.restOffText}>{t('session.restDisabled')}</Text>
              </Pressable>
            )}
          </View>
        }
        right={(props) => (
          <IconButton {...props} icon="information-outline" onPress={handleInfo} />
        )}
      />
      <Card.Content>
        {exercise.notes ? (
          <Text variant="bodySmall" style={styles.notes}>
            {exercise.notes}
          </Text>
        ) : null}
        <View style={styles.inputs}>
          <TextInput
            label={t('exercise.reps')}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={`${t('exercise.weight')} (${preferences.unit})`}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
        </View>
      </Card.Content>
      {hideActions ? null : (
        <Card.Actions>
          <Button onPress={onSkip} textColor={theme.colors.onSurfaceVariant}>
            {t('session.skipExercise')}
          </Button>
          <Button mode="contained" onPress={handleCompleteSet}>
            {t('session.completeSet')}
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      margin: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    notes: { marginBottom: 12, color: theme.colors.onSurfaceVariant, fontStyle: 'italic' },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    subtitleText: {
      color: theme.colors.onSurfaceVariant,
    },
    restOffChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: '#2a2a2a',
      flexDirection: 'row',
      alignItems: 'center',
    },
    restOffIcon: {
      marginRight: 4,
    },
    restOffText: {
      fontSize: 11,
      color: '#9ca3af',
      fontWeight: '600',
    },
    inputs: { flexDirection: 'row', gap: 12 },
    input: { flex: 1 },
  });
