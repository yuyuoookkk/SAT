import { useId, useState } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  /** Big number in the hole. */
  centerValue: string;
  centerCaption?: string;
  size?: number;
  thickness?: number;
  title: string;
}

/**
 * Donut with a 2px surface gap between arcs.
 *
 * The palette was validated with the dataviz skill's checker: the adjacent
 * Wirausaha↔Lainnya pair sits at ΔE 6.2 under protanopia, inside the band that
 * is only legal alongside secondary encoding — so every slice is named AND
 * given its percentage in the legend, and a table equivalent is exposed to
 * assistive tech. Do not remove those without re-validating.
 */
const DonutChart = ({
  slices,
  centerValue,
  centerCaption,
  size = 192,
  thickness = 24,
  title,
}: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const GAP = 2;

  let cursor = 0;

  return (
    <div className="donut">
      <div className="donut__plot" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-labelledby={tableId}>
          <title id={tableId}>{title}</title>

          {/* Track — also the empty state when there is no data yet. */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--admin-track)"
            strokeWidth={thickness}
          />

          {total > 0 &&
            slices.map((slice, i) => {
              if (slice.value <= 0) return null;
              const portion = (slice.value / total) * circumference;
              const length = Math.max(portion - GAP, 1);
              const offset = cursor;
              cursor += portion;

              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={hover === i ? thickness + 4 : thickness}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                />
              );
            })}
        </svg>

        <div className="donut__center">
          <span className="donut__value">{centerValue}</span>
          {centerCaption && <span className="donut__caption">{centerCaption}</span>}
        </div>

        {hover !== null && slices[hover] && (
          <div className="chart-tip donut__tip">
            <strong>{slices[hover].label}</strong>
            {formatNumber(slices[hover].value)} · {formatPercent(slices[hover].value, total)}%
          </div>
        )}
      </div>

      {/* Legend: name + percentage, so identity never rests on colour alone. */}
      <ul className="donut__legend">
        {slices.map((slice, i) => (
          <li
            key={slice.label}
            className={hover === i ? 'is-hover' : undefined}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="donut__swatch" style={{ backgroundColor: slice.color }} />
            <span className="donut__name">{slice.label}</span>
            <span className="donut__pct">{formatPercent(slice.value, total)}%</span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Kategori</th>
            <th scope="col">Jumlah</th>
            <th scope="col">Persentase</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((s) => (
            <tr key={s.label}>
              <th scope="row">{s.label}</th>
              <td>{formatNumber(s.value)}</td>
              <td>{formatPercent(s.value, total)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DonutChart;
