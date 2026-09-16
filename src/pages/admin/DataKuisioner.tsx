import { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  RotateCcw,
  Search,
  Store,
  Trash2,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  STATUS_LABEL,
  STATUS_TONE,
  fetchAngkatanOptions,
  fetchDashboard,
  fetchResponses,
} from '../../lib/adminData';
import type { DashboardStats, ResponseRow } from '../../lib/adminData';
import { downloadAllResponses } from '../../lib/exportResponses';
import { avatarTint, formatDate, formatNumber, formatPercent, formatTimeWita, initials } from '../../lib/format';
import { JURUSAN } from '../../lib/tracerStudy';

/** Employer, campus or business — whichever the status implies. */
const placeOf = (row: ResponseRow): string => {
  switch (row.status_saat_ini) {
    case 'bekerja':
    case 'bekerja_kuliah':
      return row.nama_perusahaan ?? '—';
    case 'kuliah':
      return row.nama_kampus ?? '—';
    case 'wirausaha':
    case 'kuliah_wirausaha':
      return row.nama_usaha ?? '—';
    default:
      return '—';
  }
};

const DataKuisioner = () => {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(8);
  const [search, setSearchValue] = useState('');
  const [jurusan, setJurusanValue] = useState('');
  const [angkatan, setAngkatanValue] = useState('');
  const [status, setStatusValue] = useState('');
  const [validasi, setValidasiValue] = useState('');
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const setSearch = (v: string) => { setSearchValue(v); setPage(1); };
  const setJurusan = (v: string) => { setJurusanValue(v); setPage(1); };
  const setAngkatan = (v: string) => { setAngkatanValue(v); setPage(1); };
  const setStatus = (v: string) => { setStatusValue(v); setPage(1); };
  const setValidasi = (v: string) => { setValidasiValue(v); setPage(1); };
  const setPageSize = (v: number) => { setPageSizeValue(v); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResponses({ search, jurusan, angkatan, status, page, pageSize });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kuisioner.');
    } finally {
      setLoading(false);
    }
  }, [search, jurusan, angkatan, status, page, pageSize]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    fetchAngkatanOptions().then(setYears).catch(() => setYears([]));
    fetchDashboard(null).then(setStats).catch(() => setStats(null));
  }, []);

  /**
   * Downloads every questionnaire response, not just the page on screen and not
   * just the rows the current filters allow — the same export the Detail Data
   * page offers, placed here because this is the page admins reach for first.
   */
  const exportAll = async () => {
    setError(null);
    setNotice(null);
    setExporting('Menyiapkan…');
    try {
      const count = await downloadAllResponses((loaded, all) => {
        setExporting(`Mengambil ${formatNumber(loaded)} / ${formatNumber(all)}…`);
      });
      setNotice(
        count === 0
          ? 'Belum ada alumni yang mengisi kuisioner, jadi tidak ada data untuk diunduh.'
          : `${formatNumber(count)} data hasil kuisioner berhasil diunduh.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunduh data kuisioner.');
    } finally {
      setExporting(null);
    }
  };

  const reset = () => {
    setSearchValue(''); setJurusanValue(''); setAngkatanValue('');
    setStatusValue(''); setValidasiValue(''); setPage(1);
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const responded = stats?.total_respons ?? 0;
  const target = stats?.total_alumni ?? 0;

  return (
    <AdminLayout>
      <div className="admin-head">
        <div>
          <h1>Data Seluruh Alumni Pengisi Kuesioner</h1>
          <p>
            Daftar rekapitulasi data diri dan status pelacakan alumni yang telah melengkapi
            kuesioner Tracer Study SMK TI Bali Global Jimbaran.
          </p>
        </div>
        <div className="admin-head__actions">
          <button
            type="button"
            className="admin-btn admin-btn--soft"
            onClick={() => void exportAll()}
            disabled={exporting !== null}
            title="Unduh seluruh hasil kuisioner sebagai file Excel"
          >
            <FileSpreadsheet size={16} />
            {exporting ?? 'Export Excel'}
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-notice">{notice}</p>}

      {/* Four summary cards */}
      <section className="kpi-grid">
        <article className="kpi kpi--violet">
          <header>
            <span className="kpi__label">Melanjutkan Kuliah</span>
            <span className="kpi__icon"><GraduationCap size={18} /></span>
          </header>
          <p className="kpi__value">
            {formatNumber(stats?.kuliah ?? 0)} <small>Alumni</small>
          </p>
          <span className="kpi__chip">
            {formatPercent(stats?.kuliah ?? 0, responded)}% PTN &amp; PTS Unggulan
          </span>
        </article>

        <article className="kpi kpi--blue">
          <header>
            <span className="kpi__label">Terserap Bekerja</span>
            <span className="kpi__icon"><Briefcase size={18} /></span>
          </header>
          <p className="kpi__value">
            {formatNumber(stats?.bekerja ?? 0)} <small>Alumni</small>
          </p>
          <span className="kpi__chip">
            {formatPercent(stats?.bekerja ?? 0, responded)}% Industri IT &amp; Kreatif
          </span>
        </article>

        <article className="kpi kpi--green">
          <header>
            <span className="kpi__label">Total Responden Terisi</span>
            <span className="kpi__icon"><ClipboardCheck size={18} /></span>
          </header>
          <p className="kpi__value">
            {formatNumber(stats?.sudah_mengisi ?? 0)} <small>/ {formatNumber(target)} Target</small>
          </p>
          <div className="kpi__meter">
            <span className="kpi__meterlabel">
              Realisasi Pengisian
              <b>{formatPercent(stats?.sudah_mengisi ?? 0, target)}%</b>
            </span>
            <span className="kpi__track">
              <span
                className="kpi__fill"
                style={{ width: `${formatPercent(stats?.sudah_mengisi ?? 0, target)}%` }}
              />
            </span>
          </div>
        </article>

        <article className="kpi kpi--amber">
          <header>
            <span className="kpi__label">Berwirausaha (Digital)</span>
            <span className="kpi__icon"><Store size={18} /></span>
          </header>
          <p className="kpi__value">
            {formatNumber(stats?.berwirausaha ?? 0)} <small>Alumni</small>
          </p>
          <span className="kpi__chip">
            {formatPercent(stats?.berwirausaha ?? 0, responded)}% Software House / Studio
          </span>
        </article>
      </section>

      <section className="admin-card admin-card--table">
        <header className="admin-filters">
          <label className="admin-search admin-search--inline">
            <Search size={16} />
            <input type="search" value={search} placeholder="Cari nama, NISN atau jurusan…"
              onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className="admin-select" value={jurusan} onChange={(e) => setJurusan(e.target.value)} aria-label="Filter jurusan">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select className="admin-select" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} aria-label="Filter angkatan">
            <option value="">Semua Angkatan</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="admin-select" value={validasi} onChange={(e) => setValidasi(e.target.value)} aria-label="Filter validasi">
            <option value="">Semua Validasi</option>
            <option value="lengkap">Data Lengkap</option>
            <option value="sebagian">Perlu Dilengkapi</option>
          </select>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={reset}>
            <RotateCcw size={15} />
            Reset
          </button>
        </header>

        <div className="admin-resultbar">
          <span>
            Menampilkan hasil filter: <b className="admin-chip">{formatNumber(total)} Data Ditemukan</b>
          </span>
        </div>

        <div className="admin-tablewrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Identitas Alumni</th>
                <th scope="col">Jurusan &amp; Angkatan</th>
                <th scope="col">Kontak Aktif</th>
                <th scope="col">Status &amp; Penempatan</th>
                <th scope="col">Waktu Pengisian</th>
                <th scope="col"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="admin-table__empty">Memuat data…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="admin-table__empty">
                  Tidak ada data yang cocok dengan filter ini.
                </td></tr>
              )}
              {!loading && rows.map((row) => {
                const tone = STATUS_TONE[row.status_saat_ini ?? ''] ?? 'idle';
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-identity">
                        <span className="cell-avatar" style={{ backgroundColor: avatarTint(row.nisn) }} aria-hidden="true">
                          {initials(row.nama_lengkap)}
                        </span>
                        <span>
                          <span className="cell-name">
                            {row.nama_lengkap ?? '—'}
                            {row.jenis_kelamin && (
                              <span className={`cell-badge cell-badge--${row.jenis_kelamin === 'Perempuan' ? 'p' : 'l'}`}>
                                {row.jenis_kelamin === 'Perempuan' ? 'P' : 'L'}
                              </span>
                            )}
                          </span>
                          <span className="cell-ids">
                            <span className="cell-sub">NISN:<br />{row.nisn ?? '—'}</span>
                            <span className="cell-ids__dot" aria-hidden="true" />
                            <span className="cell-sub">NIK:<br />{row.nik ?? '—'}</span>
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-strong">{row.jurusan ?? '—'}</span>
                      <span className="cell-sub">{row.tahun_lulus ? `Angkatan ${row.tahun_lulus}` : '—'}</span>
                    </td>
                    <td>
                      {row.no_telepon && <span className="cell-phone">{row.no_telepon}</span>}
                      {row.email && <span className="cell-sub">{row.email}</span>}
                      {!row.no_telepon && !row.email && <span className="cell-sub">—</span>}
                    </td>
                    <td>
                      <span className={`pill pill--${tone}`}>
                        <span className="pill__dot" aria-hidden="true" />
                        {STATUS_LABEL[row.status_saat_ini ?? ''] ?? 'Belum Mengisi'}
                        {tone === 'work' && (row.kesesuaian_jurusan_skor ?? 0) >= 4 && ' (Linear)'}
                      </span>
                      <span className="cell-strong">{placeOf(row)}</span>
                      {row.jabatan && tone === 'work' && <span className="cell-sub">{row.jabatan}</span>}
                    </td>
                    <td>
                      <span className="cell-strong">{formatDate(row.created_at)}</span>
                      <span className="cell-sub">{formatTimeWita(row.created_at)}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="icon-btn icon-btn--bare" aria-label={`Lihat ${row.nama_lengkap}`}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--bare icon-btn--danger" aria-label={`Hapus ${row.nama_lengkap}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="admin-pagination">
          <span>
            Menampilkan {rows.length ? (page - 1) * pageSize + 1 : 0} – {(page - 1) * pageSize + rows.length} dari{' '}
            {formatNumber(total)} alumni yang telah mengisi kuisioner
          </span>
          <div className="admin-pagination__controls">
            <select
              className="admin-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Baris per halaman"
            >
              {[8, 16, 32].map((n) => <option key={n} value={n}>{n} per halaman</option>)}
            </select>
            <button type="button" className="icon-btn" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)} aria-label="Halaman sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <span className="admin-pagination__page">{page}</span>
            <span className="admin-pagination__of">dari {pages}</span>
            <button type="button" className="icon-btn" disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)} aria-label="Halaman berikutnya">
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </AdminLayout>
  );
};

export default DataKuisioner;
