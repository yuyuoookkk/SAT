import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { STATUS_LABEL, STATUS_TONE, fetchAngkatanOptions, fetchResponses } from '../../lib/adminData';
import type { ResponseRow } from '../../lib/adminData';
import { avatarTint, formatDate, formatNumber, formatTimeWita, initials } from '../../lib/format';
import { JURUSAN } from '../../lib/tracerStudy';

const PAGE_SIZE = 8;

/** The employer / campus / business name, whichever the status implies. */
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
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState('');
  const [jurusan, setJurusanValue] = useState('');
  const [angkatan, setAngkatanValue] = useState('');
  const [status, setStatusValue] = useState('');

  // Any filter change returns to page 1. Done in the handlers rather than an
  // effect so a single interaction causes one render and one fetch.
  const setSearch = (v: string) => { setSearchValue(v); setPage(1); };
  const setJurusan = (v: string) => { setJurusanValue(v); setPage(1); };
  const setAngkatan = (v: string) => { setAngkatanValue(v); setPage(1); };
  const setStatus = (v: string) => { setStatusValue(v); setPage(1); };
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResponses({ search, jurusan, angkatan, status, page, pageSize: PAGE_SIZE });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kuisioner.');
    } finally {
      setLoading(false);
    }
  }, [search, jurusan, angkatan, status, page]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    fetchAngkatanOptions()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  const reset = () => {
    setSearchValue('');
    setJurusanValue('');
    setAngkatanValue('');
    setStatusValue('');
    setPage(1);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="admin-head">
        <div>
          <h1>Data Seluruh Alumni Pengisi Kuesioner</h1>
          <p>
            Daftar rekapitulasi detail dari status pekerjaan alumni yang telah melengkapi kuisioner
            Tracer Study SMK TI Bali Global Jimbaran.
          </p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <section className="admin-card admin-card--table">
        <header className="admin-filters">
          <label className="admin-search admin-search--inline">
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Cari nama, NISN atau jurusan…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <select className="admin-select" value={jurusan} onChange={(e) => setJurusan(e.target.value)} aria-label="Filter jurusan">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <select className="admin-select" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} aria-label="Filter angkatan">
            <option value="">Semua Angkatan</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button type="button" className="admin-btn admin-btn--ghost" onClick={reset}>
            <RotateCcw size={15} />
            Reset
          </button>
        </header>

        <p className="admin-tablecount">{formatNumber(total)} data tersedia</p>

        <div className="admin-tablewrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Identitas Alumni</th>
                <th scope="col">Jurusan &amp; Angkatan</th>
                <th scope="col">Kontak Aktif</th>
                <th scope="col">Status &amp; Pekerjaan</th>
                <th scope="col">Waktu Pengisian</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="admin-table__empty">Memuat data…</td></tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    Tidak ada data yang cocok dengan filter ini.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => {
                  const tone = STATUS_TONE[row.status_saat_ini ?? ''] ?? 'idle';
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-identity">
                          <span
                            className="cell-avatar"
                            style={{ backgroundColor: avatarTint(row.nisn) }}
                            aria-hidden="true"
                          >
                            {initials(row.nama_lengkap)}
                          </span>
                          <span>
                            <span className="cell-name">
                              {row.nama_lengkap ?? '—'}
                              {row.jenis_kelamin && (
                                <span className="cell-badge">
                                  {row.jenis_kelamin === 'Perempuan' ? 'P' : 'L'}
                                </span>
                              )}
                            </span>
                            <span className="cell-sub">NISN: {row.nisn ?? '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="cell-strong">{row.jurusan ?? '—'}</span>
                        <span className="cell-sub">
                          {row.tahun_lulus ? `Angkatan ${row.tahun_lulus}` : '—'}
                        </span>
                      </td>
                      <td>
                        {row.no_telepon && <span className="cell-phone">{row.no_telepon}</span>}
                        {row.email && <span className="cell-sub">{row.email}</span>}
                        {!row.no_telepon && !row.email && <span className="cell-sub">—</span>}
                      </td>
                      <td>
                        <span className={`pill pill--${tone}`}>
                          {STATUS_LABEL[row.status_saat_ini ?? ''] ?? 'Belum Mengisi'}
                        </span>
                        <span className="cell-sub">{placeOf(row)}</span>
                        {row.jabatan && (tone === 'work') && (
                          <span className="cell-sub">{row.jabatan}</span>
                        )}
                      </td>
                      <td>
                        <span className="cell-strong">{formatDate(row.created_at)}</span>
                        <span className="cell-sub">{formatTimeWita(row.created_at)}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <footer className="admin-pagination">
          <span>
            Menampilkan {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {(page - 1) * PAGE_SIZE + rows.length} dari {formatNumber(total)} data
          </span>
          <div className="admin-pagination__controls">
            <button
              type="button"
              className="icon-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="admin-pagination__page">{page}</span>
            <span className="admin-pagination__of">dari {pages}</span>
            <button
              type="button"
              className="icon-btn"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </AdminLayout>
  );
};

export default DataKuisioner;
