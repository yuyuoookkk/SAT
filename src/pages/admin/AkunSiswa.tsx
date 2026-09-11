import { useCallback, useEffect, useState } from 'react';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AlumniDialog from '../../components/admin/AlumniDialog';
import { deleteAlumni, fetchAlumni, importAlumniCsv, upsertAlumni } from '../../lib/adminData';
import type { AlumniRow } from '../../lib/adminData';
import { avatarTint, formatDate, formatTimeWita, initials } from '../../lib/format';

const PAGE_SIZE = 8;

const AkunSiswa = () => {
  const [rows, setRows] = useState<AlumniRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState('');

  // Searching always returns to page 1; doing it here rather than in an effect
  // avoids a second render pass and a wasted fetch of the old page.
  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<AlumniRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAlumni({ search, page, pageSize: PAGE_SIZE });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data alumni.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  const handleDelete = async (row: AlumniRow) => {
    if (!window.confirm(`Hapus data alumni "${row.nama_lengkap}"? Tindakan ini permanen.`)) return;
    try {
      await deleteAlumni(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data.');
    }
  };

  const handleSave = async (values: Partial<AlumniRow>) => {
    await upsertAlumni(values);
    await load();
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

  const exportCsv = () => {
    const header = ['NISN', 'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'Jurusan', 'Angkatan', 'Email', 'No HP'];
    const body = rows.map((r) =>
      [r.nisn, r.nik, r.nama_lengkap, r.jenis_kelamin, r.jurusan, r.angkatan, r.email, r.no_telepon]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header.join(','), ...body].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `akun-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="admin-head">
        <div>
          <h1>Detail Data Alumni &amp; Hasil Kuesioner Tracer Study</h1>
        </div>
        <div className="admin-head__actions">
          <button type="button" className="admin-btn admin-btn--outline" onClick={exportCsv}>
            <FileSpreadsheet size={16} />
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--outline"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            Impor CSV
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
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} />
            Tambah Data / Impor Siswa
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-notice">{notice}</p>}

      <section className="admin-card admin-card--table">
        <header className="admin-tablehead">
          <label className="admin-search admin-search--inline">
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Cari Akun"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </header>

        <div className="admin-tablewrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Identitas Alumni</th>
                <th scope="col">Jurusan &amp; Angkatan</th>
                <th scope="col">Kontak Aktif</th>
                <th scope="col">Waktu Pengisian</th>
                <th scope="col"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">Memuat data…</td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    Belum ada data alumni. Gunakan “Tambah Data / Impor Siswa” untuk mengisi roster.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
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
                            {row.nama_lengkap}
                            {row.jenis_kelamin && (
                              <span className="cell-badge">
                                {row.jenis_kelamin === 'Perempuan' ? 'P' : 'L'}
                              </span>
                            )}
                          </span>
                          <span className="cell-sub">NISN: {row.nisn}</span>
                          {row.nik && <span className="cell-sub">NIK: {row.nik}</span>}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-strong">{row.jurusan ?? '—'}</span>
                      <span className="cell-sub">
                        {row.angkatan ? `Angkatan ${row.angkatan}` : '—'}
                      </span>
                    </td>
                    <td>
                      {row.no_telepon && <span className="cell-phone">{row.no_telepon}</span>}
                      {row.email && <span className="cell-sub">{row.email}</span>}
                      {!row.no_telepon && !row.email && <span className="cell-sub">—</span>}
                    </td>
                    <td>
                      <span className="cell-strong">{formatDate(row.created_at)}</span>
                      <span className="cell-sub">{formatTimeWita(row.created_at)}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setEditing(row);
                            setDialogOpen(true);
                          }}
                          aria-label={`Ubah ${row.nama_lengkap}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => void handleDelete(row)}
                          aria-label={`Hapus ${row.nama_lengkap}`}
                        >
                          <Trash2 size={16} />
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
            Menampilkan {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {(page - 1) * PAGE_SIZE + rows.length} dari {total} data
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

      {dialogOpen && (
        <AlumniDialog
          row={editing}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
};

export default AkunSiswa;
