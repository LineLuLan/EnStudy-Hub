import type { Retention } from '@/features/stats/retention';

const WIDTH = 720;
const HEIGHT = 200;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

export function RetentionLine({ data }: { data: Retention }) {
  const { points, max } = data;
  if (points.length === 0) {
    return <p className="text-xs text-zinc-500">Chưa có dữ liệu retention.</p>;
  }

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  // Y axis: 0 → ceiling of max, at least 5 days so the line has visible motion.
  const yMax = Math.max(5, Math.ceil(max));
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

  // Build polyline + area path from non-zero points (skip zero-sample days so
  // gaps don't dip the line to 0 visually — but keep x-position aligned to the date).
  const coords: Array<[number, number, number]> = points.map((p, i) => [
    PADDING_LEFT + i * stepX,
    PADDING_TOP + plotHeight - (p.avgStability / yMax) * plotHeight,
    p.sampleSize,
  ]);
  const drawn = coords.filter(([, , n]) => n > 0);

  const linePath =
    drawn.length === 0
      ? ''
      : drawn
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(' ');

  const areaPath =
    drawn.length === 0
      ? ''
      : `${drawn
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(
            ' '
          )} L ${drawn[drawn.length - 1]![0].toFixed(1)} ${(PADDING_TOP + plotHeight).toFixed(1)} L ${drawn[0]![0].toFixed(1)} ${(PADDING_TOP + plotHeight).toFixed(1)} Z`;

  // Y axis ticks at 0 / 50% / 100%
  const yTicks = [0, yMax / 2, yMax];

  // X axis ticks: first, midpoint, last
  const xIndices = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full text-zinc-500 dark:text-zinc-400"
      role="img"
      aria-label={`Retention chart: avg stability over ${points.length} days, max ${yMax} days`}
    >
      {/* Grid lines */}
      {yTicks.map((v) => {
        const y = PADDING_TOP + plotHeight - (v / yMax) * plotHeight;
        return (
          <g key={v}>
            <line
              x1={PADDING_LEFT}
              x2={WIDTH - PADDING_RIGHT}
              y1={y}
              y2={y}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeDasharray="2 3"
            />
            <text x={PADDING_LEFT - 6} y={y + 3} fontSize={10} textAnchor="end" fill="currentColor">
              {v.toFixed(0)}d
            </text>
          </g>
        );
      })}

      {/* Area + line */}
      {drawn.length > 1 && <path d={areaPath} className="fill-sky-100/60 dark:fill-sky-900/30" />}
      {drawn.length > 1 && (
        <path
          d={linePath}
          className="fill-none stroke-sky-500 dark:stroke-sky-400"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots for sampled days */}
      {drawn.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={2}
          className="fill-sky-500 stroke-white dark:fill-sky-400 dark:stroke-zinc-950"
          strokeWidth={1}
        />
      ))}

      {/* X axis labels */}
      {xIndices.map((i) => {
        const p = points[i];
        if (!p) return null;
        return (
          <text
            key={i}
            x={PADDING_LEFT + i * stepX}
            y={HEIGHT - 8}
            fontSize={9}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fill="currentColor"
          >
            {p.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}
