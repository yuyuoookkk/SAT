import { useId, useState } from 'react';
import { formatNumber } from '../../lib/format';

export interface Bar {
  label: string;
  value: number;
}

interface Props {
  bars: Bar[];
  title: string;
  color?: string;
  height?: number;
}

/** Magnitude by category → vertical bars, baseline-anchored, 4px rounded ends. */
const BarChart = ({ bars, title, color = '#0b5ed7', height = 260 }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();

  const max = Math.max(...bars.map((b) => b.value), 1);

  // Round the axis to a readable step (1/2/2.5/5/10 x a power of ten) and up to
  // the next multiple, so the tallest bar never touches the top gridline.
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const niceUnit = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  const step = Math.max(1, niceUnit * magnitude);
  const ceiling = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(ceiling / step) + 1 }, (_, i) => i * step);

  if (!bars.length) {
    return <p className="chart-empty">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="barchart" aria-labelledby={titleId}>
      <span id={titleId} className="sr-only">
        {title}
      </span>

      <div className="barchart__grid" style={{ height }}>
        {ticks
          .slice()
          .reverse()
          .map((t) => (
            <div className="barchart__gridline" key={t}>
              <span className="barchart__tick">{formatNumber(t)}</span>
            </div>
          ))}
      </div>

      <div className="barchart__plot" style={{ height }}>
        {bars.map((bar, i) => (
          <div
            className="barchart__col"
            key={bar.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="barchart__barwrap">
              {hover === i && (
                <span className="chart-tip barchart__tip">
                  <strong>{bar.label}</strong>
                  {formatNumber(bar.value)} alumni
                </span>
              )}
              <div
                className="barchart__bar"
                style={{
                  height: `${(bar.value / ceiling) * 100}%`,
                  backgroundColor: color,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </div>
            <span className="barchart__label">{bar.label}</span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Jurusan</th>
            <th scope="col">Jumlah alumni</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{formatNumber(b.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BarChart;
