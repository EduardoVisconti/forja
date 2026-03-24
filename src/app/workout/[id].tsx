import { useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ActiveExerciseCard } from '@/features/workout/components/ActiveExerciseCard';
import { ExerciseQueuePanel } from '@/features/workout/components/ExerciseQueuePanel';
import { RestTimerOverlay } from '@/features/workout/components/RestTimerOverlay';
import { useActiveSession } from '@/features/workout/hooks/useActiveSession';
import { useRestTimer } from '@/features/workout/hooks/useRestTimer';
import { useUserPreferences } from '@/features/workout/hooks/useUserPreferences';
import { useWorkoutSessionStore } from '@/features/workout/store/workoutSessionStore';

export default function ActiveSessionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const { unit } = useUserPreferences();

  const store = useWorkoutSessionStore();
  const { completeSet, finishSession } = useActiveSession();
  const { restSecondsRemaining, timerRunning, skipRestTimer, addThirtySeconds } = useRestTimer();

  const currentExercise = store.exercises[store.currentExerciseIndex];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: store.templateName || t('session.activeWorkout'),
    });
  }, [navigation, store.templateName, t]);

  useEffect(() => {
    if (store.restSecondsRemaining === 0 && !store.timerRunning) {
      store.advanceSet();
    }
  }, [store.restSecondsRemaining, store.timerRunning, store]);

  if (!store.sessionId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...store.exercises];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    store.reorderExercises(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === store.exercises.length - 1) return;
    const updated = [...store.exercises];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    store.reorderExercises(updated);
  };

  const handleFinish = () => {
    Alert.alert(t('session.finishTitle'), t('session.finishMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('session.finish'), style: 'default', onPress: finishSession },
    ]);
  };

  if (!currentExercise || store.exercises.every((ex) => ex.skipped)) {
    return (
      <View style={styles.center}>
        <Text variant="headlineSmall">{t('session.allDone')}</Text>
        <Button mode="contained" onPress={finishSession} style={styles.finishBtn}>
          {t('session.finish')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {timerRunning && restSecondsRemaining !== null ? (
        <RestTimerOverlay
          secondsRemaining={restSecondsRemaining}
          onSkip={() => {
            skipRestTimer();
            store.advanceSet();
          }}
          onAdd30={addThirtySeconds}
        />
      ) : (
        <ActiveExerciseCard
          exercise={currentExercise}
          currentSet={store.currentSetNumber}
          preferences={{ unit }}
          onCompleteSet={(reps, weightKg) => {
            completeSet(reps, weightKg);
          }}
          onSkip={() => store.skipExercise(store.currentExerciseIndex)}
        />
      )}

      <View style={styles.queueHeader}>
        <Text variant="titleMedium">{t('session.exerciseQueue')}</Text>
      </View>

      <ExerciseQueuePanel
        exercises={store.exercises}
        currentIndex={store.currentExerciseIndex}
        onSelect={(index) => store.setCurrentExerciseIndex(index)}
        onSkip={(index) => store.skipExercise(index)}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      <Button
        mode="outlined"
        onPress={handleFinish}
        style={styles.finishBtn}
        textColor={theme.colors.error}
      >
        {t('session.finishEarly')}
      </Button>
    </ScrollView>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      backgroundColor: theme.colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    queueHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
      backgroundColor: theme.colors.background,
    },
    finishBtn: { margin: 16 },
  });
