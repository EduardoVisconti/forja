import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ActiveExerciseCard } from '@/features/workout/components/ActiveExerciseCard';
import { ExerciseQueuePanel } from '@/features/workout/components/ExerciseQueuePanel';
import { RestTimerCard } from '@/features/workout/components/RestTimerCard';
import { useActiveSession } from '@/features/workout/hooks/useActiveSession';
import { useRestTimer } from '@/features/workout/hooks/useRestTimer';
import { useUserPreferences } from '@/features/workout/hooks/useUserPreferences';
import { useWorkoutSessionStore } from '@/features/workout/store/workoutSessionStore';

export default function ActiveSessionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const router = useRouter();
  const { unit } = useUserPreferences();

  const store = useWorkoutSessionStore();
  const { completeSet, finishSession } = useActiveSession();
  const { restSecondsRemaining, timerRunning, skipRestTimer, addThirtySeconds } = useRestTimer();
  const hasAdvanced = useRef(false);

  const currentExercise = store.exercises[store.currentExerciseIndex];
  const currentSetNumber = currentExercise
    ? Math.min((store.completedSets[currentExercise.id] ?? 0) + 1, currentExercise.sets)
    : 1;

  const handleBack = useCallback(() => {
    Alert.alert(t('session.abandonTitle'), t('session.abandonMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('session.abandonConfirm'),
        style: 'destructive',
        onPress: () => {
          store.endSession();
          router.navigate('/(tabs)/workout');
        },
      },
    ]);
  }, [router, store, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => <IconButton icon="arrow-left" onPress={handleBack} style={{ margin: 0 }}/>,
      title: store.templateName || t('session.activeWorkout'),
    });
  }, [handleBack, navigation, store.templateName, t]);

  useEffect(() => {
    if (store.restSecondsRemaining === 0 && !store.timerRunning) {
      if (!hasAdvanced.current) {
        hasAdvanced.current = true;
        store.advanceSet();
      }
    } else {
      hasAdvanced.current = false;
    }
  }, [store.restSecondsRemaining, store.timerRunning]);

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

  const handleSelectExercise = (index: number) => {
    if (index === store.currentExerciseIndex) return;
    const selectedExercise = store.exercises[index];
    if (!selectedExercise || selectedExercise.skipped) return;

    if (store.completedExercises[selectedExercise.id]) {
      Alert.alert('Este exerc\u00edcio j\u00e1 foi conclu\u00eddo. Deseja revisitar?', '', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revisit',
          style: 'default',
          onPress: () => store.setCurrentExerciseIndex(index),
        },
      ]);
      return;
    }

    Alert.alert(`Ir para ${selectedExercise.name}?`, '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Go',
        style: 'default',
        onPress: () => store.setCurrentExerciseIndex(index),
      },
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

  const restTimerCardProps = {
    secondsRemaining: restSecondsRemaining ?? 0,
    nextExerciseName: store.nextExercise?.name ?? null,
    onSkip: () => {
      skipRestTimer();
      store.advanceSet();
    },
    onAdd30: addThirtySeconds,
  };

  if (timerRunning && restSecondsRemaining !== null) {
    console.log('[workout/[id]] RestTimerCard props:', {
      secondsRemaining: restTimerCardProps.secondsRemaining,
      nextExerciseName: restTimerCardProps.nextExerciseName,
      onSkip: 'function',
      onAdd30: 'function',
    });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <ActiveExerciseCard
        exercise={currentExercise}
        currentSet={currentSetNumber}
        preferences={{ unit }}
        onCompleteSet={(reps, weightKg) => {
          completeSet(reps, weightKg);
        }}
        onSkip={() => store.skipExercise(store.currentExerciseIndex)}
        hideActions={timerRunning}
      />

      {timerRunning && restSecondsRemaining !== null ? (
        <RestTimerCard {...restTimerCardProps} />
      ) : null}

      <View style={styles.queueHeader}>
        <Text variant="titleMedium">{t('session.exerciseQueue')}</Text>
      </View>

      <ExerciseQueuePanel
        exercises={store.exercises}
        currentIndex={store.currentExerciseIndex}
        completedExercises={store.completedExercises}
        onSelect={handleSelectExercise}
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
