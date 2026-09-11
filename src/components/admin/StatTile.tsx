import type { ComponentType } from 'react';
import { formatNumber } from '../../lib/format';

interface Props {
  label: string;
  value: number;
  tone: string;
  icon: ComponentType<{ size?: number | string }>;
  note?: string;
}

/**
 * A single headline number. Per the dataviz form heuristic this is a stat tile,
 * not a chart — one value with no comparison to plot.
 */
const StatTile = ({ label, value, tone, icon: Icon, note }: Props) => (
  <article className="stat-tile" style={{ ['--tone' as string]: tone }}>
    <span className="stat-tile__icon">
      <Icon size={18} />
    </span>
    <p className="stat-tile__label">{label}</p>
    <p className="stat-tile__value">{formatNumber(value)}</p>
    {note && <p className="stat-tile__note">{note}</p>}
  </article>
);

export default StatTile;
