import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export interface SimpleLinePoint {
  label?: string;
  value: number;
}

interface Props {
  points: SimpleLinePoint[];
  width?: number;
  height?: number;
  yMax?: number;
  strokeColor?: string;
}

const DEFAULT_HEIGHT = 220;

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const SimpleLineChart = memo(function SimpleLineChart({
  points,
  width = 320,
  height = DEFAULT_HEIGHT,
  yMax,
  strokeColor = '#8b5cf6',
}: Props) {
  const safePoints = points.length > 0 ? points : [];
  const maxValue = Math.max(yMax ?? 0, ...safePoints.map((p) => p.value), 0);

  const plotLeft = 40;
  const plotTop = 10;
  const plotBottom = 34;
  const plotRight = 8;

  const plotWidth = width - plotLeft - plotRight;
  const plotHeight = height - plotTop - plotBottom;

  const xStep = safePoints.length > 1 ? plotWidth / (safePoints.length - 1) : plotWidth;
  const getX = (i: number) => plotLeft + i * xStep;

  const getY = (value: number) => {
    const frac = maxValue > 0 ? value / maxValue : 0;
    return plotTop + plotHeight - frac * plotHeight;
  };

  const tickValues = (() => {
    const maxTicks = maxValue > 0 ? [0, maxValue / 2, maxValue] : [0];
    return maxTicks;
  })();

  const polylinePoints = safePoints
    .map((p, i) => `${getX(i)},${getY(p.value)}`)
    .join(' ');

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

        {/* Line */}
        {safePoints.length > 1 ? (
          <Polyline points={polylinePoints} fill="none" stroke={strokeColor} strokeWidth={2} />
        ) : null}

        {/* Points */}
        {safePoints.map((p, i) => {
          const cx = getX(i);
          const cy = getY(p.value);
          return (
            <g key={`p-${i}`}>
              <Circle cx={cx} cy={cy} r={3.5} fill={strokeColor} />
              <Circle cx={cx} cy={cy} r={6} fill={strokeColor} opacity={0.12} />
            </g>
          );
        })}

        {/* X axis labels (first/middle/last) */}
        {safePoints.length > 0
          ? safePoints.map((p, i) => {
              const shouldShow =
                i === 0 || i === safePoints.length - 1 || i === Math.floor((safePoints.length - 1) / 2);
              if (!shouldShow) return null;
              const x = getX(i);
              const y = plotTop + plotHeight + 18;
              if (!p.label) return null;
              return (
                <SvgText key={`x-${i}`} x={x} y={y} fontSize="10" fill="#374151" textAnchor="middle">
                  {p.label}
                </SvgText>
              );
            })
          : null}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});

