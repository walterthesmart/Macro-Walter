import { Area, AreaChart, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export interface SparklinePoint {
  date: string;
  value: number | null;
}

interface SparklineProps {
  /** Points in ascending date order. Tuned for ~24 points. */
  data: SparklinePoint[];
  height?: number;
  stroke?: string;
  fill?: string;
  /** Y-values rendered as dashed horizontal reference lines. */
  referenceLines?: number[];
}

export function Sparkline({
  data,
  height = 40,
  stroke,
  fill,
  referenceLines = [],
}: SparklineProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Mid-slate defaults stay legible on both white cards and dark surfaces.
  const resolvedStroke = stroke ?? (isDark ? '#94a3b8' : '#64748b');
  const referenceStroke = isDark ? '#64748b' : '#94a3b8';
  const dotHalo = isDark ? '#0f172a' : '#ffffff';
  const fillColor = fill ?? resolvedStroke;
  const lastIndex = data.length - 1;

  // Dot on the final point only; returns an empty <g> for every other index.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDot = (props: any) => {
    const { cx, cy, index, key } = props ?? {};
    if (index !== lastIndex || typeof cx !== 'number' || typeof cy !== 'number') {
      return <g key={key ?? `dot-${index}`} />;
    }
    return (
      <circle
        key={key ?? `dot-${index}`}
        cx={cx}
        cy={cy}
        r={2.5}
        fill={resolvedStroke}
        stroke={dotHalo}
        strokeWidth={1}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        {referenceLines.map((v) => (
          <ReferenceLine
            key={v}
            y={v}
            stroke={referenceStroke}
            strokeDasharray="3 3"
            strokeWidth={1}
            ifOverflow="extendDomain"
          />
        ))}
        <Area
          type="monotone"
          dataKey="value"
          stroke={resolvedStroke}
          strokeWidth={1.5}
          fill={fillColor}
          fillOpacity={0.12}
          connectNulls
          isAnimationActive={false}
          dot={renderDot}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
