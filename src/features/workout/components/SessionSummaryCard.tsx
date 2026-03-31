import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, Divider, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { SessionSummary } from '../hooks/useSessionSummary';

interface Props {
  summary: SessionSummary;
  unit: 'kg' | 'lbs';
}

const KG_TO_LBS = 2.20462;

export function SessionSummaryCard({ summary, unit }: Props) {
  const { t } = useTranslation();
  const [showAllSets, setShowAllSets] = useState(false);
  const isLbs = unit === 'lbs';

  const displayVolume = isLbs
    ? (summary.totalVolumeKg * KG_TO_LBS).toFixed(0)
    : summary.totalVolumeKg.toFixed(0);

  const formatWeight = (weightKg: number) =>
    isLbs ? (weightKg * KG_TO_LBS).toFixed(1) : weightKg.toFixed(1);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {t('summary.title')}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.monthlyStat}>
          <Text style={styles.monthlyValue}>{summary.durationMinutes}</Text>
          <Text style={styles.monthlyLabel}>{t('summary.minutes')}</Text>
        </View>
        <View style={styles.monthlyStat}>
          <Text style={styles.monthlyValue}>{displayVolume}</Text>
          <Text style={styles.monthlyLabel}>{unit}</Text>
        </View>
        <View style={styles.monthlyStat}>
          <Text style={styles.monthlyValue}>{summary.exerciseSummaries.length}</Text>
          <Text style={styles.monthlyLabel}>{t('summary.exercisesCompleted')}</Text>
        </View>
      </View>

      {summary.prs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{`🏆 ${t('summary.prsTitle')}`}</Text>
          <View style={styles.prs}>
            {summary.prs.map((pr) => (
              <Chip key={pr.exerciseName} icon="trophy" style={styles.prChip}>
                {`${pr.exerciseName} - ${formatWeight(pr.weightKg)} ${unit}`}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        {summary.exerciseSummaries.map((exercise, index) => (
          <View key={exercise.exerciseId}>
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                <Text style={styles.exerciseMeta}>
                  {`${exercise.setsCompleted} séries · ${t('summary.bestSet')}: ${formatWeight(
                    exercise.bestSetWeightKg,
                  )} ${unit} × ${exercise.bestSetReps}`}
                </Text>
              </View>
              {exercise.isPR ? <Text style={styles.prBadge}>🏆 PR</Text> : null}
            </View>
            {index < summary.exerciseSummaries.length - 1 ? <Divider style={styles.exerciseDivider} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Pressable style={styles.expandRow} onPress={() => setShowAllSets((prev) => !prev)}>
          <Text style={styles.expandText}>
            {showAllSets ? `${t('summary.hideSets')} ▴` : `${t('summary.viewAllSets')} ▾`}
          </Text>
        </Pressable>
        {showAllSets ? (
          <View style={styles.fullSetLogs}>
            <Divider style={styles.exerciseDivider} />
            {summary.setLogs.map((log, index) => (
              <View key={log.id}>
                <List.Item
                  title={log.exerciseName}
                  titleStyle={styles.setTitle}
                  description={`${t('summary.set')} ${log.setNumber}: ${log.repsDone} × ${formatWeight(
                    log.weightKg,
                  )} ${unit}`}
                  descriptionStyle={styles.setDescription}
                />
                {index < summary.setLogs.length - 1 ? <Divider style={styles.exerciseDivider} /> : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { textAlign: 'center', fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 8,
  },
  monthlyStat: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  monthlyValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  monthlyLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  prs: { gap: 8, padding: 12 },
  prChip: {},
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  exerciseMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#9ca3af',
  },
  prBadge: {
    fontSize: 12,
    color: '#22c55e',
  },
  exerciseDivider: {
    backgroundColor: '#2a2a2a',
  },
  expandRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  expandText: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '600',
  },
  fullSetLogs: {
    paddingBottom: 4,
  },
  setTitle: {
    color: '#ffffff',
    fontSize: 14,
  },
  setDescription: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
