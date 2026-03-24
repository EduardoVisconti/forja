import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { CardioLog } from '../types';

interface Props {
  log: CardioLog;
  unit: 'kg' | 'lbs';
  onEdit: () => void;
  onDelete: () => void;
}

const KM_TO_MILES = 0.621371;

function useLogTitle(log: CardioLog): string {
  const { t } = useTranslation();
  const parts: string[] = [];

  if (log.trainingType) {
    parts.push(t(`cardio.trainingType.${log.trainingType}`));
  }
  if (log.zone) {
    parts.push(t(`cardio.zone.${log.zone}`));
  }

  return parts.length > 0 ? parts.join(' — ') : t('cardio.title');
}

export function CardioLogItem({ log, unit, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const isImperial = unit === 'lbs';
  const title = useLogTitle(log);

  const displayDistance = isImperial
    ? `${(log.distanceKm * KM_TO_MILES).toFixed(2)} mi`
    : `${log.distanceKm.toFixed(2)} km`;

  const paceUnit = isImperial ? t('cardio.pacePerMile') : t('cardio.pacePerKm');
  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.stat}>
      <Text variant="labelSmall" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Card.Title
        title={title}
        subtitle={log.date}
        right={(props) => (
          <View style={styles.actions}>
            <IconButton {...props} icon="pencil-outline" onPress={onEdit} />
            <IconButton {...props} icon="trash-can-outline" onPress={onDelete} />
          </View>
        )}
      />
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Stat label={t('cardio.duration')} value={`${log.durationMinutes} min`} />
          <Stat label={t('cardio.distance')} value={displayDistance} />
          <Stat label={t('cardio.avgPace')} value={`${log.avgPace} ${paceUnit}`} />
          {log.avgHr !== null && (
            <Stat label={t('cardio.avgHr')} value={`${log.avgHr} bpm`} />
          )}
        </View>
        {log.notes ? (
          <Text variant="bodySmall" style={styles.notes}>
            {log.notes}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    content: { gap: 8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    stat: { minWidth: 70 },
    statLabel: { color: theme.colors.onSurfaceVariant, marginBottom: 2 },
    statValue: { fontWeight: '600', color: theme.colors.onSurface },
    actions: { flexDirection: 'row' },
    notes: { color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 4 },
  });
