import { StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { CardioRecord } from '../types/plans';

interface Props {
  record: CardioRecord;
  onEdit?: () => void;
  onDelete?: () => void;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function resolveTrainingTypeLabel(trainingType: string, t: (key: string) => string): string {
  if (trainingType === 'regenerative') return t('cardio.trainingType.regenerative');
  if (trainingType === 'intervals') return t('cardio.trainingType.intervals');
  if (trainingType === 'long') return t('cardio.trainingType.long');
  if (trainingType === 'strong') return t('cardio.trainingType.strong');
  if (trainingType === 'walk') return t('cardio.trainingType.walk');
  return trainingType;
}

export function CardioRecordCard({ record, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const activityLabel = t(`cardioPlan.activity.${record.activityType}`);
  const title = record.trainingType
    ? `${activityLabel} - ${resolveTrainingTypeLabel(record.trainingType, t)}`
    : activityLabel;

  const metrics = [
    record.duration,
    record.distanceKm !== null ? `${record.distanceKm} ${t('cardioPlan.unitKm')}` : null,
    record.avgPace ? `${record.avgPace} ${t('cardioPlan.minPerKm')}` : null,
    record.avgHr !== null ? `${record.avgHr} ${t('cardioPlan.bpm')}` : null,
  ].filter(Boolean) as string[];

  return (
    <Card style={styles.card}>
      <Card.Title
        title={title}
        subtitle={formatDate(record.performedAt)}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
        right={() => (
          <View style={styles.actions}>
            {onEdit ? <IconButton icon="pencil-outline" onPress={onEdit} iconColor={colors.textSecondary} /> : null}
            {onDelete ? (
              <IconButton icon="trash-can-outline" onPress={onDelete} iconColor={colors.textSecondary} />
            ) : null}
          </View>
        )}
      />
      <Card.Content style={styles.content}>
        {metrics.length > 0 ? (
          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <View key={metric} style={styles.metricPill}>
                <Text variant="labelMedium" style={styles.metricText}>
                  {metric}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {record.planId ? (
          <Chip compact style={styles.planTag} textStyle={styles.planTagText}>
            {t('cardioPlan.fromPlan')}
          </Chip>
        ) : null}

        {record.perceivedEffort !== null ? (
          <Text variant="bodySmall" style={styles.inlineText}>
            {t('cardioPlan.rpeValue', { value: record.perceivedEffort })}
          </Text>
        ) : null}

        {record.notes ? (
          <Text variant="bodySmall" style={styles.inlineText}>
            {record.notes}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.cardio,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  content: {
    gap: 8,
    paddingBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metricText: {
    color: colors.textSecondary,
  },
  inlineText: {
    color: colors.textSecondary,
  },
  planTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardioLight,
  },
  planTagText: {
    color: colors.cardioDark,
  },
});
