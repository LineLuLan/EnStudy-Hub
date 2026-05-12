import type { MaturityCounts } from '@/features/stats/maturity';

const SIZE = 200;
const RADIUS = 80;
const INNER_RADIUS = 50;
const CX = SIZE / 2;
const CY = SIZE / 2;

const SEGMENTS: Array<{
  key: keyof Pick<MaturityCounts, 'new' | 'learning' | 'review' | 'relearning'>;
  fillClass: string;
  swatchClass: string;
  label: string;
}> = [
  {
    key: 'new',
    fillClass: 'fill-zinc-300 dark:fill-zinc-600',
    swatchClass: 'bg-zinc-300 dark:bg-zinc-600',
    label: 'Mới',
  },
  {
    key: 'learning',
    fillClass: 'fill-amber-400 dark:fill-amber-500',
    swatchClass: 'bg-amber-400 dark:bg-amber-500',
    label: 'Đang học',
  },
  {
    key: 'review',
    fillClass: 'fill-emerald-500 dark:fill-emerald-400',
    swatchClass: 'bg-emerald-500 dark:bg-emerald-400',
    label: 'Ôn',
  },
  {
    key: 'relearning',
    fillClass: 'fill-red-400 dark:fill-red-500',
    swatchClass: 'bg-red-400 dark:bg-red-500',
    label: 'Học lại',
  },
];

function polar(angleRad: number, r: number): [number, number] {
  // Angles run clockwise from 12 o'clock (so 0 = top).
  return [CX + r * Math.sin(angleRad), CY - r * Math.cos(angleRad)];
}

function donutPath(startAngle: number, endAngle: number): string {
  const [x1, y1] = polar(startAngle, RADIUS);
  const [x2, y2] = polar(endAngle, RADIUS);
  const [x3, y3] = polar(endAngle, INNER_RADIUS);
  const [x4, y4] = polar(startAngle, INNER_RADIUS);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function MaturityPie({ data }: { data: MaturityCounts }) {
  if (data.total === 0) {
    return <p className="text-xs text-zinc-500">Chưa có thẻ nào được enroll.</p>;
  }

  let cursor = 0;
  const arcs = SEGMENTS.map((seg) => {
    const count = data[seg.key];
    const fraction = count / data.total;
    const start = cursor * Math.PI * 2;
    const end = (cursor + fraction) * Math.PI * 2;
    cursor += fraction;
    return { ...seg, count, fraction, start, end };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-44 w-44 shrink-0"
        role="img"
        aria-label={`Card maturity: ${data.total} total — ${data.mature} mature (≥21 day stability)`}
      >
        {arcs.map((arc) =>
          arc.count === 0 ? null : (
            <path
              key={arc.key}
              d={donutPath(arc.start, arc.end === arc.start ? arc.end + 0.001 : arc.end)}
              className={arc.fillClass}
              stroke="white"
              strokeWidth={1}
            >
              <title>
                {arc.label}: {arc.count} ({(arc.fraction * 100).toFixed(0)}%)
              </title>
            </path>
          )
        )}
        <text
          x={CX}
          y={CY - 4}
          fontSize={14}
          fontWeight={600}
          textAnchor="middle"
          className="fill-zinc-900 dark:fill-zinc-50"
        >
          {data.total}
        </text>
        <text x={CX} y={CY + 12} fontSize={9} textAnchor="middle" className="fill-zinc-500">
          tổng thẻ
        </text>
      </svg>

      <div className="flex-1 space-y-2 text-sm">
        {SEGMENTS.map((seg) => {
          const count = data[seg.key];
          const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
          return (
            <div key={seg.key} className="flex items-center gap-3">
              <span className={`h-3 w-3 shrink-0 rounded-sm ${seg.swatchClass}`} />
              <span className="text-zinc-700 dark:text-zinc-300">{seg.label}</span>
              <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums">
                {count} · {pct}%
              </span>
            </div>
          );
        })}
        <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Thuộc <span className="text-[11px] text-zinc-500">(≥21d stability)</span>
            </span>
            <span className="ml-auto font-mono text-xs text-emerald-700 tabular-nums dark:text-emerald-300">
              {data.mature} · {data.total > 0 ? Math.round((data.mature / data.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
