import type { ForecastResult } from '@/features/stats/forecast-utils';

const WIDTH = 720;
const HEIGHT = 180;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;
const BAR_GAP_RATIO = 0.3;

export function DueForecastBar({ data }: { data: ForecastResult }) {
  const { days, maxCount, total, overdue } = data;
  if (days.length === 0 || total === 0) {
    return (
      <p className="text-xs text-zinc-500">
        Chưa có thẻ đến hạn trong 7 ngày tới. Học thêm bài mới để FSRS xếp lịch.
      </p>
    );
  }

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slot = plotWidth / days.length;
  const barWidth = slot * (1 - BAR_GAP_RATIO);
  const yMax = Math.max(1, maxCount);
  const yTicks = [0, Math.ceil(yMax / 2), yMax];

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Forecast due ${total} thẻ trong 7 ngày tới`}
        className="w-full"
      >
        {/* Y axis grid + labels */}
        {yTicks.map((tick) => {
          const y = PADDING_TOP + plotHeight - (tick / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeDasharray={tick === 0 ? undefined : '2 3'}
              />
              <text
                x={PADDING_LEFT - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-500 text-[9px]"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {days.map((day, i) => {
          const x = PADDING_LEFT + i * slot + (slot - barWidth) / 2;
          const barHeight = (day.count / yMax) * plotHeight;
          const y = PADDING_TOP + plotHeight - barHeight;
          // Today's bar gets amber (overdue collapsed in), future days = sky.
          const isToday = day.isToday;
          const fillClass = isToday
            ? 'fill-amber-500 dark:fill-amber-400'
            : 'fill-sky-500 dark:fill-sky-400';
          return (
            <g key={day.key}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={2} className={fillClass}>
                <title>
                  {day.label} · {day.key}: {day.count} thẻ
                  {isToday && overdue > 0 ? ` (trong đó ${overdue} quá hạn)` : ''}
                </title>
              </rect>
              {/* Count label above bar when ≥1 */}
              {day.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-zinc-700 text-[10px] font-medium dark:fill-zinc-300"
                >
                  {day.count}
                </text>
              )}
              {/* X axis label */}
              <text
                x={x + barWidth / 2}
                y={PADDING_TOP + plotHeight + 18}
                textAnchor="middle"
                className={
                  isToday
                    ? 'fill-amber-700 text-[10px] font-semibold dark:fill-amber-300'
                    : 'fill-zinc-500 text-[10px]'
                }
              >
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" />
          Hôm nay {overdue > 0 ? `(gồm ${overdue} quá hạn)` : ''}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500 dark:bg-sky-400" />
          Sắp tới
        </span>
        <span className="ml-auto">Tổng: {total} thẻ</span>
      </div>
    </div>
  );
}
