import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

export interface SimpleBarChartItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  items: SimpleBarChartItem[];
  width?: number;
  height?: number;
  yMax?: number;
}

const DEFAULT_HEIGHT = 220;

function formatTick(value: number): string {
  // Keep it simple for small UI labels.
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const SimpleBarChart = memo(function SimpleBarChart({
  items,
  width = 320,
  height = DEFAULT_HEIGHT,
  yMax,
}: Props) {
  const safeItems = items.length > 0 ? items : [];

  const maxValue = Math.max(
    yMax ?? 0,
    ...safeItems.map((i) => i.value),
  );

  const plotLeft = 40;
  const plotTop = 10;
  const plotBottom = 34;
  const plotRight = 8;

  const plotWidth = width - plotLeft - plotRight;
  const plotHeight = height - plotTop - plotBottom;

  const barSlot = safeItems.length > 0 ? plotWidth / safeItems.length : plotWidth;
  const barWidth = barSlot * 0.6;

  const ticks = maxValue > 0 ? 3 : 1;
  const tickValues = Array.from({ length: ticks + 1 }).map((_, idx) => (maxValue * idx) / ticks);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid + Y axis ticks */}
        {tickValues.map((v, idx) => {
          const frac = maxValue > 0 ? v / maxValue : 0;
          const y = plotTop + plotHeight - frac * plotHeight;
          return (
            <g key={`tick-${idx}`}>
              <Line x1={plotLeft} x2={plotLeft + plotWidth} y1={y} y2={y} stroke="#e5e7eb" />
              <SvgText x={plotLeft - 6} y={y + 4} fontSize="10" fill="#6b7280" textAnchor="end">
                {formatTick(v)}
              </SvgText>
            </g>
          );
        })}

        {/* Bars */}
        {safeItems.map((item, i) => {
          const frac = maxValue > 0 ? item.value / maxValue : 0;
          const barHeight = frac * plotHeight;
          const x = plotLeft + i * barSlot + (barSlot - barWidth) / 2;
          const y = plotTop + plotHeight - barHeight;
          return <Rect key={item.label} x={x} y={y} width={barWidth} height={barHeight} fill={item.color} rx={3} />;
        })}

        {/* X axis labels (first/middle/last) */}
        {safeItems.length > 0 &&
          safeItems.map((item, i) => {
            const shouldShow = i === 0 || i === safeItems.length - 1 || i === Math.floor((safeItems.length - 1) / 2);
            if (!shouldShow) return null;
            const x = plotLeft + i * barSlot + barSlot / 2;
            const y = plotTop + plotHeight + 18;
            return (
              <SvgText
                key={`${item.label}-x`}
                x={x}
                y={y}
                fontSize="10"
                fill="#374151"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});

