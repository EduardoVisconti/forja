import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import type { CardioPlan } from '../types/plans';

interface Props {
  plan: CardioPlan;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
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

export function CardioPlanCard({ plan, onComplete, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const activity = t(`cardioPlan.activity.${plan.activityType}`);
  const subtitle = plan.trainingType
    ? `${activity} - ${resolveTrainingTypeLabel(plan.trainingType, t)}`
    : activity;

  const metrics = [
    plan.targetDistance !== null ? `${plan.targetDistance} ${t('cardioPlan.unitKm')}` : null,
    plan.targetDuration,
    plan.targetZone ? plan.targetZone.toUpperCase() : null,
  ].filter(Boolean) as string[];

  const isCompleted = plan.status === 'completed';

  return (
    <Card style={[styles.card, isCompleted ? styles.completedCard : null]}>
      <Card.Title
        title={plan.title}
        subtitle={`${subtitle} - ${formatDate(plan.plannedDate)}`}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
        right={() =>
          isCompleted ? (
            <Chip compact style={styles.completedBadge} textStyle={styles.completedBadgeText}>
              {t('cardioPlan.completedBadge')}
            </Chip>
          ) : (
            <View style={styles.actions}>
              <IconButton icon="pencil-outline" onPress={onEdit} iconColor={colors.textSecondary} />
              <IconButton icon="trash-can-outline" onPress={onDelete} iconColor={colors.textSecondary} />
            </View>
          )
        }
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

        {isCompleted && plan.completedAt ? (
          <Text variant="bodySmall" style={styles.completedDate}>
            {t('cardioPlan.completedAt', { date: formatDate(plan.completedAt.slice(0, 10)) })}
          </Text>
        ) : null}

        {isCompleted ? (
          plan.completedRecordId ? (
            <Button mode="text" onPress={onComplete} contentStyle={styles.buttonContent}>
              {t('cardioPlan.viewRecord')}
            </Button>
          ) : null
        ) : (
          <Button mode="contained" onPress={onComplete} contentStyle={styles.buttonContent}>
            {t('cardioPlan.completePlan')}
          </Button>
        )}
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
  completedCard: {
    opacity: 0.7,
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
  completedBadge: {
    marginRight: 12,
    backgroundColor: colors.completeLight,
  },
  completedBadgeText: {
    color: colors.completeDark,
  },
  completedDate: {
    color: colors.textSecondary,
  },
  buttonContent: {
    justifyContent: 'center',
  },
});
