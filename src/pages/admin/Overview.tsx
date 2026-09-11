import { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  GraduationCap,
  Rocket,
  Upload,
  Users,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatTile from '../../components/admin/StatTile';
import DonutChart from '../../components/admin/DonutChart';
import BarChart from '../../components/admin/BarChart';
import { fetchAngkatanOptions, fetchDashboard } from '../../lib/adminData';
import type { DashboardStats } from '../../lib/adminData';
import { formatNumber, formatPercent, timeAgo } from '../../lib/format';

/** Validated with the dataviz palette checker — see DonutChart for the caveat. */
const STATUS_COLORS = {
  bekerja: '#0b5ed7',
  kuliah: '#a855f7',
  wirausaha: '#d73480',
  lainnya: '#6b7a99',
};

const ACTIVITY_ICON = {
  submission: CheckCircle2,
  import: Upload,
  admin: ClipboardCheck,
} as const;

const Overview = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [angkatan, setAngkatan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    // `alive` drops the response of a filter change the user has already
    // superseded, so a slow request cannot overwrite newer results.
    let alive = true;

    fetchDashboard(angkatan ? Number(angkatan) : null)
      .then((data) => {
        if (!alive) return;
        setStats(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [angkatan, reloadKey]);

  useEffect(() => {
    fetchAngkatanOptions()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  const exportCsv = () => {
    if (!stats) return;
    const rows = [
      ['Metrik', 'Nilai'],
      ['Total Alumni', stats.total_alumni],
      ['Sudah Mengisi', stats.sudah_mengisi],
      ['Belum Mengisi', stats.belum_mengisi],
      ['Bekerja', stats.bekerja],
      ['Kuliah', stats.kuliah],
      ['Berwirausaha', stats.berwirausaha],
      ...stats.per_jurusan.map((j) => [`Jurusan: ${j.jurusan}`, j.total]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-tracer-study-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = stats;
  const responded = s?.total_respons ?? 0;
  const slices = s
    ? [
        { label: 'Bekerja', value: s.bekerja, color: STATUS_COLORS.bekerja },
        { label: 'Kuliah', value: s.kuliah, color: STATUS_COLORS.kuliah },
        { label: 'Wirausaha', value: s.berwirausaha, color: STATUS_COLORS.wirausaha },
        { label: 'Lainnya', value: s.lainnya, color: STATUS_COLORS.lainnya },
      ]
    : [];

  const matched = s?.kesesuaian.sesuai ?? 0;
  const rated = s?.kesesuaian.dinilai ?? 0;
  const matchPct = formatPercent(matched, rated);

  return (
    <AdminLayout search={{ value: search, onChange: setSearch }}>
      <div className="admin-head">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time statistics for SMK TI Bali Global alumni career progress.</p>
        </div>
        <div className="admin-head__actions">
          <select
            className="admin-select"
            value={angkatan}
            onChange={(e) => setAngkatan(e.target.value)}
            aria-label="Filter angkatan"
          >
            <option value="">Semua Angkatan</option>
            {years.map((y) => (
              <option key={y} value={y}>
                Angkatan {y}
              </option>
            ))}
          </select>
          <button type="button" className="admin-btn admin-btn--primary" onClick={exportCsv}>
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {error && (
        <p className="admin-error">
          {error}
          <button type="button" className="admin-btn admin-btn--ghost" onClick={reload}>
            Coba lagi
          </button>
        </p>
      )}

      {loading && !s && <p className="admin-loading">Memuat statistik…</p>}

      {s && (
        <>
          <section className="stat-row">
            <StatTile label="Total Alumni" value={s.total_alumni} tone="#0b5ed7" icon={Users} />
            <StatTile
              label="Sudah Mengisi"
              value={s.sudah_mengisi}
              tone="#a855f7"
              icon={CheckCircle2}
              note={`${formatPercent(s.sudah_mengisi, s.total_alumni)}% completion rate`}
            />
            <StatTile
              label="Belum Mengisi"
              value={s.belum_mengisi}
              tone="#d73480"
              icon={Clock}
              note="Follow up required"
            />
            <StatTile label="Bekerja" value={s.bekerja} tone="#b45309" icon={Briefcase} />
            <StatTile label="Kuliah" value={s.kuliah} tone="#0f766e" icon={GraduationCap} />
            <StatTile label="Berwirausaha" value={s.berwirausaha} tone="#be185d" icon={Rocket} />
          </section>

          <section className="admin-grid admin-grid--charts">
            <article className="admin-card">
              <h2 className="admin-card__title">Status Alumni</h2>
              <DonutChart
                title="Distribusi status alumni"
                slices={slices}
                centerValue={`${formatPercent(s.bekerja, responded)}%`}
                centerCaption="Bekerja"
              />
            </article>

            <article className="admin-card">
              <header className="admin-card__head">
                <h2 className="admin-card__title">Alumni per Jurusan</h2>
                <span className="admin-card__meta">
                  {angkatan ? `Angkatan ${angkatan}` : 'Semua Angkatan'}
                </span>
              </header>
              <BarChart
                title="Jumlah alumni per jurusan"
                bars={s.per_jurusan.map((j) => ({ label: j.jurusan, value: j.total }))}
              />
            </article>
          </section>

          <section className="admin-grid admin-grid--charts">
            <article className="admin-card">
              <h2 className="admin-card__title">Kesesuaian Jurusan</h2>
              <p className="admin-card__sub">Link and Match index with industry</p>
              <DonutChart
                title="Kesesuaian pekerjaan dengan jurusan"
                size={168}
                thickness={20}
                slices={[
                  { label: 'Sesuai Jurusan', value: matched, color: '#0b5ed7' },
                  { label: 'Tidak Sesuai', value: rated - matched, color: '#6b7a99' },
                ]}
                centerValue={`${matchPct}%`}
                centerCaption="MATCHED"
              />
              <dl className="matchlist">
                <div>
                  <dt>Sesuai Jurusan</dt>
                  <dd>{formatNumber(matched)}</dd>
                </div>
                <div>
                  <dt>Tidak Sesuai</dt>
                  <dd>{formatNumber(Math.max(rated - matched, 0))}</dd>
                </div>
              </dl>
            </article>

            <article className="admin-card">
              <h2 className="admin-card__title">Aktivitas Terakhir</h2>
              {s.aktivitas.length === 0 ? (
                <p className="chart-empty">Belum ada aktivitas tercatat.</p>
              ) : (
                <ul className="activity">
                  {s.aktivitas.map((a, i) => {
                    const Icon = ACTIVITY_ICON[a.kind] ?? CheckCircle2;
                    return (
                      <li key={`${a.created_at}-${i}`}>
                        <span className={`activity__icon activity__icon--${a.kind}`}>
                          <Icon size={16} />
                        </span>
                        <span>
                          <span className="activity__msg">{a.message}</span>
                          <span className="activity__time">{timeAgo(a.created_at)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default Overview;
