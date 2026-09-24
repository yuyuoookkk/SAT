/* =============================================================================
 * Admin screen 4 of 4 — "Persetujuan".
 *
 * The queue of alumni who have signed up and are waiting to be let in. Until
 * an admin approves them here, their account exists and can log in, but cannot
 * file a questionnaire response.
 *
 * WHY THE SCHOOL NEEDS THIS AT ALL
 *
 * Without it, anyone who finds the URL can register and submit answers, and
 * the resulting data describes strangers as readily as alumni. Approval is
 * what makes the dataset worth using for accreditation.
 *
 * WHAT THE ADMIN IS SHOWN, AND WHY
 *
 * Name, NISN, NIK, jurusan, WhatsApp and sex — collected at sign-up — next to
 * a verdict: does that NISN exist in the school's own roster?
 *
 *     "Cocok: Rekayasa Perangkat Lunak (RPL) · 2024"   found, with its details
 *     "Tidak ada di data induk"                        not found
 *     "Berbeda dari data induk"                        found, but the jurusan
 *                                                      they typed disagrees
 *
 * The mismatch is flagged rather than quietly corrected: the roster is the
 * record, and a disagreement is exactly the thing an admin should decide on.
 *
 * WHAT THIS PAGE CANNOT DO
 *
 * The client may write `status` and `note` and nothing else. Who decided, and
 * when, are stamped by a database trigger (migration 0008), so the audit trail
 * cannot be forged from a browser. Approval itself is enforced by the INSERT
 * policy on tracer_study — an unapproved account is refused by Postgres even
 * if it never loads this application.
 * ========================================================================== */

import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  APPROVAL_LABEL,
  decideAccountRequest,
  fetchAccountRequests,
} from '../../lib/adminData';
import type { AccountRequestRow, ApprovalStatus } from '../../lib/adminData';
import { avatarTint, formatDate, formatNumber, formatTimeWita, initials } from '../../lib/format';

const TONE: Record<ApprovalStatus, string> = {
  pending: 'idle',
  approved: 'work',
  rejected: 'business',
};

/** Who an account says it is, for the avatar and the name cell. */
const nameOf = (row: AccountRequestRow) =>
  row.full_name?.trim() || row.email?.split('@')[0] || 'Tanpa nama';

const Persetujuan = () => {
  const [rows, setRows] = useState<AccountRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(8);
  const [search, setSearchValue] = useState('');
  const [status, setStatusValue] = useState<ApprovalStatus | ''>('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setSearch = (v: string) => { setSearchValue(v); setPage(1); };
  const setStatus = (v: ApprovalStatus | '') => { setStatusValue(v); setPage(1); };
  const setPageSize = (v: number) => { setPageSizeValue(v); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAccountRequests({ search, status, page, pageSize });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — pastikan migrasi 0008_account_approval.sql sudah dijalankan.`
          : 'Gagal memuat daftar pendaftaran.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page, pageSize]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  const decide = async (row: AccountRequestRow, next: ApprovalStatus) => {
    setError(null);
    setNotice(null);
    setBusy(row.user_id);
    try {
      await decideAccountRequest(row.user_id, next);
      setNotice(
        next === 'approved'
          ? `${nameOf(row)} disetujui dan sekarang dapat mengisi kuisioner.`
          : `${nameOf(row)} ditolak dan tidak dapat mengisi kuisioner.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan keputusan.');
    } finally {
      setBusy(null);
    }
  };

  const reset = () => { setSearchValue(''); setStatusValue(''); setPage(1); };
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout>
      <div className="admin-head">
        <div>
          <h1>Persetujuan Pendaftaran Alumni</h1>
          <p>
            Akun yang baru mendaftar belum dapat mengisi kuisioner sampai disetujui di sini.
            Periksa NISN terhadap data induk alumni sebelum memutuskan.
          </p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-notice">{notice}</p>}

      <section className="admin-card admin-card--table">
        <header className="admin-filters">
          <label className="admin-search admin-search--inline">
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Cari nama, email, NISN atau NIK…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="admin-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApprovalStatus | '')}
            aria-label="Filter status persetujuan"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="approved">Sudah Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={reset}>
            <RotateCcw size={15} />
            Reset
          </button>
        </header>

        <div className="admin-resultbar">
          <span>
            Menampilkan hasil filter:{' '}
            <b className="admin-chip">{formatNumber(total)} Pendaftaran</b>
          </span>
        </div>

        <div className="admin-tablewrap">
          <table className="admin-table admin-table--approvals">
            <thead>
              <tr>
                <th scope="col">Pendaftar</th>
                <th scope="col">NISN, NIK &amp; Data Induk</th>
                <th scope="col">Jurusan &amp; Kontak</th>
                <th scope="col">Waktu Daftar</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Keputusan</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="admin-table__empty">Memuat pendaftaran…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="admin-table__empty">
                  {status === 'pending'
                    ? 'Tidak ada pendaftaran yang menunggu persetujuan.'
                    : 'Tidak ada pendaftaran yang cocok dengan filter ini.'}
                </td></tr>
              )}
              {!loading && rows.map((row) => (
                <tr key={row.user_id}>
                  <td>
                    <div className="cell-identity">
                      <span
                        className="cell-avatar"
                        style={{ backgroundColor: avatarTint(row.nisn ?? row.user_id) }}
                        aria-hidden="true"
                      >
                        {initials(nameOf(row))}
                      </span>
                      <span>
                        <span className="cell-name">
                          {nameOf(row)}
                          {row.jenis_kelamin && (
                            <span
                              className={`cell-badge cell-badge--${row.jenis_kelamin === 'Perempuan' ? 'p' : 'l'}`}
                            >
                              {row.jenis_kelamin === 'Perempuan' ? 'P' : 'L'}
                            </span>
                          )}
                        </span>
                        <span className="cell-sub">{row.email ?? '—'}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="cell-strong">NISN {row.nisn ?? 'tidak diisi'}</span>
                    <span className="cell-sub">NIK {row.nik ?? 'tidak diisi'}</span>
                    {row.cocok_roster ? (
                      <span className="cell-match cell-match--ok">
                        <BadgeCheck size={14} />
                        Cocok: {row.jurusan ?? '—'}
                        {row.angkatan ? ` · ${row.angkatan}` : ''}
                      </span>
                    ) : (
                      <span className="cell-match cell-match--warn">
                        <ShieldAlert size={14} />
                        Tidak ada di data induk
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="cell-strong">{row.jurusan_pendaftar ?? '—'}</span>
                    {/* Flagged rather than reconciled: the roster is the record,
                        and a mismatch is exactly what the admin should see. */}
                    {row.cocok_roster
                      && row.jurusan
                      && row.jurusan_pendaftar
                      && row.jurusan !== row.jurusan_pendaftar && (
                      <span className="cell-match cell-match--warn">
                        <ShieldAlert size={14} />
                        Berbeda dari data induk
                      </span>
                    )}
                    <span className="cell-sub">{row.no_telepon ?? 'Tanpa nomor WhatsApp'}</span>
                  </td>
                  <td>
                    <span className="cell-strong">{formatDate(row.requested_at)}</span>
                    <span className="cell-sub">{formatTimeWita(row.requested_at)}</span>
                  </td>
                  <td>
                    <span className={`pill pill--${TONE[row.status]}`}>
                      <span className="pill__dot" aria-hidden="true" />
                      {APPROVAL_LABEL[row.status]}
                    </span>
                    {row.status !== 'pending' && row.decided_at && (
                      <span className="cell-sub">{formatDate(row.decided_at)}</span>
                    )}
                    {row.sudah_mengisi && (
                      <span className="cell-sub">Sudah mengisi kuisioner</span>
                    )}
                  </td>
                  <td>
                    <div className="cell-actions">
                      {row.status !== 'approved' && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          disabled={busy === row.user_id}
                          onClick={() => void decide(row, 'approved')}
                        >
                          <Check size={15} />
                          Setujui
                        </button>
                      )}
                      {row.status !== 'rejected' && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm admin-btn--danger"
                          disabled={busy === row.user_id}
                          onClick={() => void decide(row, 'rejected')}
                        >
                          <X size={15} />
                          Tolak
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="admin-pagination">
          <span>
            Menampilkan {rows.length ? (page - 1) * pageSize + 1 : 0} –{' '}
            {(page - 1) * pageSize + rows.length} dari {formatNumber(total)} pendaftaran
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

      <p className="admin-foot-note">
        <Clock size={14} />
        Persetujuan berlaku di tingkat basis data: akun yang belum disetujui akan ditolak oleh
        server meskipun mencoba mengirim data di luar halaman kuisioner.
      </p>
    </AdminLayout>
  );
};

export default Persetujuan;
