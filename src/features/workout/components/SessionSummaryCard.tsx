import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SessionSummary } from '../hooks/useSessionSummary';

interface Props {
  summary: SessionSummary;
  unit: 'kg' | 'lbs';
}

const KG_TO_LBS = 2.20462;

export function SessionSummaryCard({ summary, unit }: Props) {
  const { t } = useTranslation();
  const isLbs = unit === 'lbs';

  const displayVolume = isLbs
    ? (summary.totalVolumeKg * KG_TO_LBS).toFixed(0)
    : summary.totalVolumeKg.toFixed(0);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {t('summary.title')}
      </Text>

      <Card style={styles.card}>
        <Card.Content style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="displaySmall">{summary.durationMinutes}</Text>
            <Text variant="labelMedium">{t('summary.minutes')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="displaySmall">{displayVolume}</Text>
            <Text variant="labelMedium">{t('summary.totalVolume', { unit })}</Text>
          </View>
        </Card.Content>
      </Card>

      {summary.prs.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title={t('summary.prsTitle')} />
          <Card.Content style={styles.prs}>
            {summary.prs.map((pr) => {
              const w = isLbs ? (pr.weightKg * KG_TO_LBS).toFixed(1) : pr.weightKg.toFixed(1);
              return (
                <Chip key={pr.exerciseName} icon="trophy" style={styles.prChip}>
                  {`${pr.exerciseName} — ${w} ${unit}`}
                </Chip>
              );
            })}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title={t('summary.setsLog')} />
        <Divider />
        {summary.setLogs.map((log) => (
          <List.Item
            key={log.id}
            title={log.exerciseName}
            description={`${t('summary.set')} ${log.setNumber}: ${log.repsDone} × ${
              isLbs ? (log.weightKg * KG_TO_LBS).toFixed(1) : log.weightKg.toFixed(1)
            } ${unit}`}
          />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { textAlign: 'center', fontWeight: 'bold' },
  card: {},
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 8 },
  stat: { alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 60, backgroundColor: '#e0e0e0' },
  prs: { gap: 8, paddingBottom: 8 },
  prChip: {},
});
