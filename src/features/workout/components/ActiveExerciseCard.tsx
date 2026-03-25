import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SessionExercise } from '../types/session';
import type { UserPreferences } from '../types/index';

interface Props {
  exercise: SessionExercise;
  currentSet: number;
  preferences: UserPreferences;
  onCompleteSet: (reps: number, weightKg: number) => void;
  onSkip: () => void;
  hideActions?: boolean;
}

const KG_TO_LBS = 2.20462;

export function ActiveExerciseCard({
  exercise,
  currentSet,
  preferences,
  onCompleteSet,
  onSkip,
  hideActions = false,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const isLbs = preferences.unit === 'lbs';
  const displayWeight = useMemo(() => {
    const stored = exercise.weight;
    const storedUnit = exercise.weightUnit ?? 'kg';

    if (storedUnit === preferences.unit) {
      return String(stored);
    }

    if (preferences.unit === 'lbs') {
      return String(Math.round(stored * 2.205 * 10) / 10);
    }
    return String(Math.round((stored / 2.205) * 10) / 10);
  }, [exercise.weight, exercise.weightUnit, preferences.unit]);

  const [reps, setReps] = useState(String(exercise.reps));
  const [weight, setWeight] = useState(displayWeight);

  const handleCompleteSet = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (isNaN(repsNum) || isNaN(weightNum)) return;
    const weightKg = isLbs ? weightNum / KG_TO_LBS : weightNum;
    onCompleteSet(repsNum, weightKg);
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
        subtitle={t('session.setProgress', { current: currentSet, total: exercise.sets })}
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
    inputs: { flexDirection: 'row', gap: 12 },
    input: { flex: 1 },
  });
