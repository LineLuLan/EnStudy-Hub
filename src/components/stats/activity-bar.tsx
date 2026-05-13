import type { Activity, ActivityCell } from '@/features/stats/activity';

const WIDTH = 720;
const HEIGHT = 200;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const BAR_GAP_RATIO = 0.25; // 25% of slot width used as gap

const SEGMENTS: Array<{
  key: keyof Pick<ActivityCell, 'again' | 'hard' | 'good' | 'easy'>;
  fillClass: string;
  swatchClass: string;
  label: string;
}> = [
  {
    key: 'again',
    fillClass: 'fill-red-400 dark:fill-red-500',
    swatchClass: 'bg-red-400 dark:bg-red-500',
    label: 'Again',
  },
  {
    key: 'hard',
    fillClass: 'fill-amber-400 dark:fill-amber-500',
    swatchClass: 'bg-amber-400 dark:bg-amber-500',
    label: 'Hard',
  },
  {
    key: 'good',
    fillClass: 'fill-emerald-500 dark:fill-emerald-400',
    swatchClass: 'bg-emerald-500 dark:bg-emerald-400',
    label: 'Good',
  },
  {
    key: 'easy',
    fillClass: 'fill-sky-500 dark:fill-sky-400',
    swatchClass: 'bg-sky-500 dark:bg-sky-400',
    label: 'Easy',
  },
];

export function ActivityBar({ data }: { data: Activity }) {
  const { cells, max } = data;
  if (cells.length === 0 || data.total === 0) {
    return <p className="text-xs text-zinc-500">Chưa có hoạt động ôn trong 30 ngày qua.</p>;
  }

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slot = plotWidth / cells.length;
  const barWidth = slot * (1 - BAR_GAP_RATIO);
  const yMax = Math.max(1, max);

  const yTicks = [0, Math.ceil(yMax / 2), yMax];

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full text-zinc-500 dark:text-zinc-400"
        role="img"
        aria-label={`Daily activity stacked bar: ${data.total} reviews over ${cells.length} days, max ${max} per day`}
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
              <text
                x={PADDING_LEFT - 6}
                y={y + 3}
                fontSize={10}
                textAnchor="end"
                fill="currentColor"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Stacked bars */}
        {cells.map((cell, i) => {
          const slotX = PADDING_LEFT + i * slot + (slot - barWidth) / 2;
          let cumulative = 0;
          return (
            <g key={cell.date}>
              {SEGMENTS.map((seg) => {
                const count = cell[seg.key];
                if (count === 0) return null;
                const segHeight = (count / yMax) * plotHeight;
                const y = PADDING_TOP + plotHeight - (cumulative / yMax) * plotHeight - segHeight;
                cumulative += count;
                return (
                  <rect
                    key={seg.key}
                    x={slotX}
                    y={y}
                    width={barWidth}
                    height={segHeight}
                    rx={1.5}
                    className={seg.fillClass}
                  >
                    <title>
                      {cell.date}: {seg.label} ×{count}
                    </title>
                  </rect>
                );
              })}
            </g>
          );
        })}

        {/* X axis labels: first / mid / last */}
        {[0, Math.floor((cells.length - 1) / 2), cells.length - 1].map((i) => {
          const c = cells[i];
          if (!c) return null;
          return (
            <text
              key={i}
              x={PADDING_LEFT + i * slot + slot / 2}
              y={HEIGHT - 8}
              fontSize={9}
              textAnchor={i === 0 ? 'start' : i === cells.length - 1 ? 'end' : 'middle'}
              fill="currentColor"
            >
              {c.date.slice(5)}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1">
            <span className={`h-2 w-2 rounded-sm ${seg.swatchClass}`} />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
