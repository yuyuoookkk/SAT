import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AlumniDialog from '../../components/admin/AlumniDialog';
import {
  deleteAlumni,
  fetchAlumniOverview,
  importAlumniCsv,
  upsertAlumni,
} from '../../lib/adminData';
import type { AlumniOverviewRow, AlumniRow } from '../../lib/adminData';
import { downloadAllResponses } from '../../lib/exportResponses';
import { avatarTint, formatDate, formatNumber, formatTimeWita, initials } from '../../lib/format';
import { JURUSAN } from '../../lib/tracerStudy';

const PAGE_SIZE = 8;

const AkunSiswa = () => {
  const [rows, setRows] = useState<AlumniOverviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState('');
  const [jurusan, setJurusanValue] = useState('');
  const [status, setStatusValue] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<AlumniRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Filter changes return to page 1 — handled here rather than in an effect so
  // one interaction causes one render and one fetch.
  const setSearch = (v: string) => { setSearchValue(v); setPage(1); };
  const setJurusan = (v: string) => { setJurusanValue(v); setPage(1); };
  const setStatus = (v: string) => { setStatusValue(v); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAlumniOverview({ search, jurusan, status, page, pageSize: PAGE_SIZE });
      setRows(sortDesc ? res.rows : [...res.rows].reverse());
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data alumni.');
    } finally {
      setLoading(false);
    }
  }, [search, jurusan, status, page, sortDesc]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  const handleSave = async (values: Partial<AlumniRow>) => {
    await upsertAlumni(values);
    await load();
  };

  const handleDelete = async (row: AlumniOverviewRow) => {
    if (!window.confirm(`Hapus data alumni "${row.nama_lengkap}"? Tindakan ini permanen.`)) return;
    try {
      await deleteAlumni(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data.');
    }
  };

  const handleImport = async (file: File) => {
    setError(null);
    setNotice(null);
    try {
      const count = await importAlumniCsv(await file.text());
      setNotice(`${count} baris data alumni berhasil diimport.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor file.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  /**
   * Exports every questionnaire response, not just the rows on screen.
   * Paging through the whole table can take a moment on a large cohort, so the
   * button reports progress rather than appearing to hang.
   */
  const exportAll = async () => {
    setError(null);
    setNotice(null);
    setExporting('Menyiapkan…');
    try {
      const count = await downloadAllResponses((loaded, total) => {
        setExporting(`Mengambil ${formatNumber(loaded)} / ${formatNumber(total)}…`);
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

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="admin-head">
        <h1>Detail Data Alumni &amp; Hasil Kuesioner Tracer Study</h1>
        <div className="admin-head__actions">
          <button
            type="button"
            className="admin-btn admin-btn--soft"
            onClick={() => void exportAll()}
            disabled={exporting !== null}
            title="Unduh seluruh hasil kuisioner sebagai file Excel"
          >
            <FileSpreadsheet size={16} />
            {exporting ?? 'Export'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--soft"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
            }}
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
          >
            <Plus size={16} />
            Tambah / Impor Data Siswa
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-notice">{notice}</p>}

      <section className="admin-card admin-card--table">
        {/* The filter row doubles as the table header, as in the design. */}
        <header className="roster-head">
          <label className="admin-search admin-search--inline">
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Cari Akun..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="admin-select" value={jurusan} onChange={(e) => setJurusan(e.target.value)} aria-label="Filter jurusan">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak">Tidak Aktif</option>
          </select>
          <select
            className="admin-select"
            value={sortDesc ? 'desc' : 'asc'}
            onChange={(e) => setSortDesc(e.target.value === 'desc')}
            aria-label="Urutkan waktu pembuatan"
          >
            <option value="desc">Waktu Pembuatan</option>
            <option value="asc">Terlama Dahulu</option>
          </select>
        </header>

        <div className="admin-tablewrap">
          <table className="admin-table roster-table">
            <caption className="sr-only">Daftar akun alumni</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Identitas alumni</th>
                <th scope="col">Jurusan dan angkatan</th>
                <th scope="col">Status dan kontak</th>
                <th scope="col">Waktu pembuatan</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="admin-table__empty">Memuat data…</td></tr>}

              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="admin-table__empty">
                  Belum ada data alumni yang cocok. Gunakan “Tambah / Impor Data Siswa”.
                </td></tr>
              )}

              {!loading && rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="cell-identity">
                      <span className="cell-avatar" style={{ backgroundColor: avatarTint(row.nisn) }} aria-hidden="true">
                        {initials(row.nama_lengkap)}
                      </span>
                      <span>
                        <span className="cell-name">
                          {row.nama_lengkap}
                          {row.jenis_kelamin && (
                            <span className={`cell-badge cell-badge--${row.jenis_kelamin === 'Perempuan' ? 'p' : 'l'}`}>
                              {row.jenis_kelamin === 'Perempuan' ? 'P' : 'L'}
                            </span>
                          )}
                        </span>
                        <span className="cell-ids">
                          <span className="cell-sub">NISN:<br />{row.nisn}</span>
                          <span className="cell-ids__dot" aria-hidden="true" />
                          <span className="cell-sub">NIK:<br />{row.nik ?? '—'}</span>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="cell-strong">{row.jurusan ?? '—'}</span>
                    <span className="cell-sub">{row.angkatan ? `Angkatan ${row.angkatan}` : '—'}</span>
                  </td>
                  <td>
                    <span className={`dot-status dot-status--${row.sudah_mengisi ? 'on' : 'off'}`}>
                      {row.sudah_mengisi ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    <span className="cell-sub">{row.email ?? row.no_telepon ?? '—'}</span>
                  </td>
                  <td>
                    <span className="cell-strong">{formatDate(row.created_at)}</span>
                    <span className="cell-sub">{formatTimeWita(row.created_at)}</span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="icon-btn icon-btn--bare"
                        onClick={() => { setEditing(row); setDialogOpen(true); }}
                        aria-label={`Ubah ${row.nama_lengkap}`}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--bare icon-btn--danger"
                        onClick={() => void handleDelete(row)}
                        aria-label={`Hapus ${row.nama_lengkap}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="admin-pagination">
          <span>
            Menampilkan {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0} – {(page - 1) * PAGE_SIZE + rows.length} dari {total} akun
          </span>
          <div className="admin-pagination__controls">
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

      {dialogOpen && (
        <AlumniDialog row={editing} onClose={() => setDialogOpen(false)} onSave={handleSave} />
      )}
    </AdminLayout>
  );
};

export default AkunSiswa;
