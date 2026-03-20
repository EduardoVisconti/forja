import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { DaySummaryVM } from '../types/historyTypes';

function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  visible: boolean;
  summary: DaySummaryVM | null;
  onDismiss: () => void;
}

export function DaySummaryDialog({ visible, summary, onDismiss }: Props) {
  const { t } = useTranslation();

  const hasAny =
    Boolean(summary?.hasWorkout) || Boolean(summary?.hasCardio) || Boolean(summary?.hasHabits);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{t('history.daySummary.title')}</Dialog.Title>
        <Dialog.Content>
          {summary ? (
            <>
              <Text style={styles.dateText}>{formatDDMMYYYY(summary.dateISO)}</Text>

              {!hasAny ? (
                <Text>{t('history.daySummary.empty')}</Text>
              ) : (
                <View style={styles.sections}>
                  {summary.hasWorkout && summary.workout ? (
                    <View style={styles.section}>
                      <Text variant="labelLarge" style={styles.sectionTitle}>
                        {t('history.daySummary.workoutsTitle')}
                      </Text>
                      <Text>{t('history.daySummary.workoutsLine', { count: summary.workout.sessionsCount })}</Text>
                      <Text style={styles.subtle}>
                        {t('history.daySummary.workoutsVolumeLine', { volume: Math.round(summary.workout.totalVolumeKg) })}
                      </Text>
                      {summary.workout.templateNames.length > 0 ? (
                        <View style={styles.chips}>
                          {summary.workout.templateNames.slice(0, 5).map((name) => (
                            <Chip key={name} compact style={styles.chip}>
                              {name}
                            </Chip>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {summary.hasCardio && summary.cardio ? (
                    <View style={styles.section}>
                      <Text variant="labelLarge" style={styles.sectionTitle}>
                        {t('history.daySummary.cardioTitle')}
                      </Text>
                      <Text>{t('history.daySummary.cardioLine', { count: summary.cardio.logs.length })}</Text>
                      <Text style={styles.subtle}>
                        {t('history.daySummary.cardioDurationLine', { minutes: summary.cardio.totalDurationMinutes })}
                      </Text>
                    </View>
                  ) : null}

                  {summary.hasHabits && summary.habits ? (
                    <View style={styles.section}>
                      <Text variant="labelLarge" style={styles.sectionTitle}>
                        {t('history.daySummary.habitsTitle')}
                      </Text>
                      <Text>
                        {t('history.daySummary.habitsScoreLine', {
                          score: summary.habits.check.score,
                          total: summary.habits.check.totalActive,
                        })}
                      </Text>
                      {summary.habits.checkedHabits.length > 0 ? (
                        <View style={styles.chips}>
                          {summary.habits.checkedHabits.map((h) => (
                            <Chip key={h.habitId} compact style={styles.chip}>
                              {`${h.emoji} ${h.label}`}
                            </Chip>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              )}
            </>
          ) : (
            <Text>{t('history.daySummary.empty')}</Text>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { maxWidth: 420 },
  dateText: { fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  sections: { gap: 14 },
  section: { gap: 6 },
  sectionTitle: { marginBottom: 2 },
  subtle: { color: '#6b7280', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {},
});

