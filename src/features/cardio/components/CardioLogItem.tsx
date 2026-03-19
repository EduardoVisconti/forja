import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { CardioLog } from '../types';

interface Props {
  log: CardioLog;
  unit: 'kg' | 'lbs';
  onEdit: () => void;
  onDelete: () => void;
}

const KM_TO_MILES = 0.621371;

export function CardioLogItem({ log, unit, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const isImperial = unit === 'lbs';

  const displayDistance = isImperial
    ? `${(log.distanceKm * KM_TO_MILES).toFixed(2)} mi`
    : `${log.distanceKm.toFixed(2)} km`;

  const paceUnit = isImperial ? t('cardio.pacePerMile') : t('cardio.pacePerKm');

  return (
    <Card style={styles.card}>
      <Card.Title
        title={t(`cardio.category.${log.category}`)}
        subtitle={log.date}
        right={(props) => (
          <View style={styles.actions}>
            <IconButton {...props} icon="pencil-outline" size={20} onPress={onEdit} />
            <IconButton {...props} icon="trash-can-outline" size={20} onPress={onDelete} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="labelSmall" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  content: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { minWidth: 70 },
  statLabel: { color: '#6b7280', marginBottom: 2 },
  statValue: { fontWeight: '600' },
  actions: { flexDirection: 'row' },
  notes: { color: '#6b7280', fontStyle: 'italic', marginTop: 4 },
});
