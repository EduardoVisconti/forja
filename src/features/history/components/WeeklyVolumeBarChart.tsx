import { useWindowDimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WeeklyVolumeVM } from '../types/historyTypes';
import { SimpleBarChart } from './charts/SimpleBarChart';

interface Props {
  data: WeeklyVolumeVM | null;
}

export function WeeklyVolumeBarChart({ data }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - 32, 280);

  const items = data?.items?.map((i) => ({
    label: t(`history.templateGroup.${i.labelKey}`),
    value: i.valueKg,
    color: i.color,
  }));

  const maxValue = data?.maxValueKg ?? 0;

  return (
    <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
      <Card.Title title={t('history.weeklyVolume.title')} />
      <Card.Content>
        {data ? (
          <SimpleBarChart items={items ?? []} width={chartWidth} height={220} yMax={maxValue} />
        ) : (
          <Text>{t('common.loading')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

