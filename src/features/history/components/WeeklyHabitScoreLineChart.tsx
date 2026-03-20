import { useWindowDimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WeeklyHabitScoreVM } from '../types/historyTypes';
import { SimpleLineChart } from './charts/SimpleLineChart';

interface Props {
  data: WeeklyHabitScoreVM | null;
}

function weekdayKeyFromDateISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const jsDay = date.getDay(); // 0 Sun..6 Sat
  switch (jsDay) {
    case 1:
      return 'mon';
    case 2:
      return 'tue';
    case 3:
      return 'wed';
    case 4:
      return 'thu';
    case 5:
      return 'fri';
    case 6:
      return 'sat';
    case 0:
      return 'sun';
    default:
      return 'mon';
  }
}

export function WeeklyHabitScoreLineChart({ data }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - 32, 280);

  const points =
    data?.points?.map((p) => ({
      value: p.value,
      label: t(`history.weekdays.${weekdayKeyFromDateISO(p.dateISO)}`),
    })) ?? [];

  return (
    <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
      <Card.Title title={t('history.weeklyHabitScore.title')} />
      <Card.Content>
        {data ? (
          <SimpleLineChart points={points} width={chartWidth} height={220} yMax={data.maxHabits} strokeColor="#8b5cf6" />
        ) : (
          <Text>{t('common.loading')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

