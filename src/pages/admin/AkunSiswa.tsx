/* =============================================================================
 * Admin screen 2 of 4 — "Akun Siswa".
 *
 * The school's master list of alumni (table `alumni`), which is a different
 * thing from the questionnaire responses. A person exists here whether or not
 * they have ever answered, and whether or not they have ever made an account.
 *
 * WHAT AN ADMIN DOES HERE
 *
 *   - Add, edit or delete a single alumnus (AlumniDialog)
 *   - Import a whole cohort from CSV, upserted on NISN so re-importing a
 *     corrected file updates rather than duplicates
 *   - Export every questionnaire response to Excel
 *   - See who is on the site right now
 *
 * THE TWO FILTERS, WHICH ANSWER DIFFERENT QUESTIONS
 *
 *   Aktif / Tidak Aktif    Is this person on the website at this moment?
 *                          Live presence — see usePresence and migration 0012.
 *   Sudah / Belum Mengisi  Have they ever filed a response? A permanent fact.
 *
 * They were one filter once, and "Aktif" meant "has answered" — a state that
 * could never change back, which made the column useless. Splitting them is
 * what made both questions answerable.
 *
 * Rows are read from the view `admin_alumni_overview`, which joins the roster
 * to response history and to presence so this page issues one query instead of
 * three per row.
 * ========================================================================== */

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
import { avatarTint, formatDate, formatNumber, formatTimeWita, initials, timeAgo } from '../../lib/format';
import { JURUSAN } from '../../lib/tracerStudy';

const PAGE_SIZE = 8;

const AkunSiswa = () => {
  const [rows, setRows] = useState<AlumniOverviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState('');
  const [jurusan, setJurusanValue] = useState('');
  const [kehadiran, setKehadiranValue] = useState('');
  const [pengisian, setPengisianValue] = useState('');
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
  const setKehadiran = (v: string) => { setKehadiranValue(v); setPage(1); };
  const setPengisian = (v: string) => { setPengisianValue(v); setPage(1); };

  /**
   * `quiet` skips the spinner. The presence poll below runs every 20 seconds,
   * and flashing "Memuat data…" over the whole table three times a minute
   * would be worse than the staleness it fixes.
   */
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await fetchAlumniOverview({
        search, jurusan, kehadiran, pengisian, page, pageSize: PAGE_SIZE,
      });
      setRows(sortDesc ? res.rows : [...res.rows].reverse());
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — jika ini menyebut "sedang_online", jalankan migrasi 0010_user_presence.sql.`
          : 'Gagal memuat data alumni.',
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [search, jurusan, kehadiran, pengisian, page, sortDesc]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  /**
   * Presence can go stale without anything being sent — a laptop lid closing,
   * a dropped connection — so the table re-asks rather than waiting for an
   * event. Fifteen seconds against a sixty-second window keeps the dot within
   * a quarter of a window of the truth, and a tab that closes cleanly reports
   * itself immediately (see usePresence), so most changes land on the next
   * poll rather than at the end of the window.
   */
  useEffect(() => {
    const id = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(id);
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
          <select
            className="admin-select"
            value={kehadiran}
            onChange={(e) => setKehadiran(e.target.value)}
            aria-label="Filter kehadiran"
          >
            <option value="">Semua Status</option>
            <option value="online">Aktif (sedang online)</option>
            <option value="offline">Tidak Aktif</option>
          </select>
          {/* Kept alongside presence rather than replaced by it: "has answered"
              is a different question, and the roster is where it gets asked. */}
          <select
            className="admin-select"
            value={pengisian}
            onChange={(e) => setPengisian(e.target.value)}
            aria-label="Filter pengisian kuisioner"
          >
            <option value="">Semua Pengisian</option>
            <option value="sudah">Sudah Mengisi</option>
            <option value="belum">Belum Mengisi</option>
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
                    <span className={`dot-status dot-status--${row.sedang_online ? 'on' : 'off'}`}>
                      {row.sedang_online ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    <span className="cell-sub">
                      {row.sedang_online
                        ? 'Sedang membuka situs'
                        : row.last_seen_at
                          ? `Terakhir dilihat ${timeAgo(row.last_seen_at)}`
                          : 'Belum pernah masuk'}
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
