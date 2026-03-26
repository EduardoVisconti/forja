import { StyleSheet, useWindowDimensions } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import type { WeeklyHabitScoreVM } from '../types/historyTypes';

interface Props {
  data: WeeklyHabitScoreVM | null;
}

function toLocalDayISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastNDaysISO(n: number, endDate: Date): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    result.push(toLocalDayISO(d));
  }
  return result;
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

function getBarColor(percentage: number): string {
  if (percentage === 100) return '#22c55e';
  if (percentage >= 75) return '#ef4444';
  if (percentage >= 50) return '#f97316';
  return '#525252';
}

export function WeeklyHabitScoreLineChart({ data }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - 32, 280);
  const chartHeight = 184;
  const horizontalPadding = 8;
  const maxBarHeight = 140;
  const barTop = 18;
  const dayLabelY = barTop + maxBarHeight + 14;
  const barGap = 8;
  const innerWidth = chartWidth - horizontalPadding * 2;
  const barWidth = (innerWidth - barGap * 6) / 7;

  const pointsByDate = new Map((data?.points ?? []).map((p) => [p.dateISO, p.value]));
  const last7 = getLastNDaysISO(7, new Date());
  const bars = last7.map((dateISO) => {
    const percentage = Math.max(0, Math.min(100, Math.round(pointsByDate.get(dateISO) ?? 0)));
    return {
      dateISO,
      percentage,
      label: t(`history.weekdays.${weekdayKeyFromDateISO(dateISO)}`),
    };
  });

  return (
    <Card style={styles.card}>
      <Card.Title title={t('history.weeklyHabitScore.title')} />
      <Card.Content>
        {data ? (
          <Svg width={chartWidth} height={chartHeight}>
            {bars.map((bar, index) => {
              const x = horizontalPadding + index * (barWidth + barGap);
              const filledHeight = Math.round((bar.percentage / 100) * maxBarHeight);
              const y = barTop + (maxBarHeight - filledHeight);

              return (
                <G key={bar.dateISO}>
                  <Rect x={x} y={barTop} width={barWidth} height={maxBarHeight} fill="#1e1e1e" rx={4} />
                  {bar.percentage > 0 ? (
                    <>
                      <Rect x={x} y={y} width={barWidth} height={filledHeight} fill={getBarColor(bar.percentage)} rx={4} />
                      <SvgText
                        x={x + barWidth / 2}
                        y={Math.max(10, y - 4)}
                        fill="#9ca3af"
                        fontSize={10}
                        textAnchor="middle"
                      >
                        {`${bar.percentage}%`}
                      </SvgText>
                    </>
                  ) : null}
                  <SvgText x={x + barWidth / 2} y={dayLabelY} fill="#525252" fontSize={10} textAnchor="middle">
                    {bar.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        ) : (
          <Text>{t('common.loading')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
  });
