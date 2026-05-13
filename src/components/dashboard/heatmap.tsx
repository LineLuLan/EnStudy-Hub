import type { Heatmap } from '@/features/stats/heatmap';

const CELL = 12;
const GAP = 3;
const STRIDE = CELL + GAP;
const ROWS = 7;
const LEFT_LABEL = 18; // space for day-of-week labels
const TOP_LABEL = 16; // space for month labels

const DOW_LABELS = ['', 'T2', '', 'T4', '', 'T6', ''];
const MONTH_VI = [
  'Th 1',
  'Th 2',
  'Th 3',
  'Th 4',
  'Th 5',
  'Th 6',
  'Th 7',
  'Th 8',
  'Th 9',
  'Th 10',
  'Th 11',
  'Th 12',
];

type Slot = { date: string; count: number; empty: boolean };

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'fill-zinc-100 dark:fill-zinc-900';
  const t = count / max;
  if (t <= 0.25) return 'fill-sky-200 dark:fill-sky-900';
  if (t <= 0.5) return 'fill-sky-300 dark:fill-sky-800';
  if (t <= 0.75) return 'fill-sky-500 dark:fill-sky-700';
  return 'fill-sky-600 dark:fill-sky-500';
}

export function HeatmapGrid({ data }: { data: Heatmap }) {
  if (data.cells.length === 0) {
    return <p className="text-xs text-zinc-500">Chưa có hoạt động ôn tập trong 12 tuần qua.</p>;
  }

  const firstCell = data.cells[0];
  const firstDow = firstCell ? new Date(`${firstCell.date}T00:00:00Z`).getUTCDay() : 0;

  const padded: Slot[] = [
    ...Array.from({ length: firstDow }, () => ({ date: '', count: 0, empty: true }) as Slot),
    ...data.cells.map((c) => ({ ...c, empty: false }) as Slot),
  ];
  const cols = Math.ceil(padded.length / ROWS);
  const width = LEFT_LABEL + cols * STRIDE;
  const height = TOP_LABEL + ROWS * STRIDE;

  // Compute month labels: for each column, look at the date in row 0 — if it's
  // the first cell of that month within the visible range, place a label.
  const monthLabels: Array<{ x: number; text: string }> = [];
  let lastMonth = -1;
  for (let col = 0; col < cols; col += 1) {
    const cell = padded[col * ROWS];
    if (!cell || cell.empty) continue;
    const month = Number(cell.date.slice(5, 7));
    if (month !== lastMonth) {
      monthLabels.push({
        x: LEFT_LABEL + col * STRIDE,
        text: MONTH_VI[month - 1] ?? '',
      });
      lastMonth = month;
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-zinc-500 dark:text-zinc-400"
      role="img"
      aria-label={`Hoạt động ôn tập 12 tuần qua: ${data.total} thẻ chấm trên ${data.cells.length} ngày`}
    >
      {monthLabels.map((m) => (
        <text key={m.x} x={m.x} y={10} fontSize={9} fill="currentColor">
          {m.text}
        </text>
      ))}
      {DOW_LABELS.map((label, row) =>
        label ? (
          <text
            key={row}
            x={0}
            y={TOP_LABEL + row * STRIDE + CELL - 2}
            fontSize={9}
            fill="currentColor"
          >
            {label}
          </text>
        ) : null
      )}
      {padded.map((slot, i) => {
        const col = Math.floor(i / ROWS);
        const row = i % ROWS;
        if (slot.empty) {
          return (
            <rect
              key={i}
              x={LEFT_LABEL + col * STRIDE}
              y={TOP_LABEL + row * STRIDE}
              width={CELL}
              height={CELL}
              rx={2}
              className="fill-transparent"
            />
          );
        }
        return (
          <rect
            key={i}
            x={LEFT_LABEL + col * STRIDE}
            y={TOP_LABEL + row * STRIDE}
            width={CELL}
            height={CELL}
            rx={2}
            className={intensityClass(slot.count, data.max)}
          >
            <title>
              {slot.date}: {slot.count} thẻ
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
