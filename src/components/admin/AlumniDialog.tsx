/**
 * Add or edit one alumnus in the school roster.
 *
 * The same dialog does both: passing `row = null` opens it empty for a new
 * entry, passing a row opens it filled in. One component rather than two
 * near-identical ones, so the validation rules cannot drift apart.
 *
 * Saving upserts on NISN, which means correcting somebody who already exists
 * updates them instead of creating a duplicate — the same rule the CSV import
 * follows, for the same reason: NISN is the one identifier the school can rely
 * on being unique.
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { AlumniRow } from '../../lib/adminData';
import { JURUSAN } from '../../lib/tracerStudy';

interface Props {
  /** `null` opens the dialog in "add" mode. */
  row: AlumniRow | null;
  onClose: () => void;
  onSave: (values: Partial<AlumniRow>) => Promise<void>;
}

const YEARS = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i);

/**
 * Keep a stored value that is not in the canonical list as a selectable option.
 * Without this a legacy or imported spelling silently resets to empty on save,
 * quietly destroying data the admin never meant to touch.
 */
const withCurrent = (options: readonly string[], current: string | null | undefined): string[] =>
  current && !options.includes(current) ? [current, ...options] : [...options];

const AlumniDialog = ({ row, onClose, onSave }: Props) => {
  // The dialog is mounted fresh each time it opens, so props seed state
  // directly — no syncing effect needed.
  const [values, setValues] = useState<Partial<AlumniRow>>(row ? { ...row } : {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes, as in any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k: keyof AlumniRow, v: string) =>
    setValues((prev) => ({ ...prev, [k]: v === '' ? null : v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({
        ...values,
        angkatan: values.angkatan ? Number(values.angkatan) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={row ? 'Ubah data alumni' : 'Tambah data alumni'}>
      <div className="modal__backdrop" onClick={onClose} />
      <form className="modal__panel" onSubmit={handleSubmit}>
        <header className="modal__head">
          <h2>{row ? 'Ubah Data Alumni' : 'Tambah Data Alumni'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </header>

        {error && <p className="admin-error">{error}</p>}

        <div className="modal__grid">
          <label className="field">
            <span className="field__label">NISN</span>
            <input
              className="form-control"
              required
              inputMode="numeric"
              maxLength={10}
              minLength={10}
              placeholder="10 digit angka"
              value={values.nisn ?? ''}
              onChange={(e) => set('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </label>

          <label className="field">
            <span className="field__label">NIK</span>
            <input
              className="form-control"
              inputMode="numeric"
              maxLength={16}
              placeholder="16 digit angka"
              value={values.nik ?? ''}
              onChange={(e) => set('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
            />
          </label>

          <label className="field field--wide">
            <span className="field__label">Nama Lengkap</span>
            <input
              className="form-control"
              required
              value={values.nama_lengkap ?? ''}
              onChange={(e) => set('nama_lengkap', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Jenis Kelamin</span>
            <select
              className="form-control"
              value={values.jenis_kelamin ?? ''}
              onChange={(e) => set('jenis_kelamin', e.target.value)}
            >
              <option value="">—</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">Angkatan</span>
            <select
              className="form-control"
              value={values.angkatan ?? ''}
              onChange={(e) => set('angkatan', e.target.value)}
            >
              <option value="">—</option>
              {withCurrent(YEARS.map(String), values.angkatan ? String(values.angkatan) : null).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label className="field field--wide">
            <span className="field__label">Jurusan</span>
            <select
              className="form-control"
              value={values.jurusan ?? ''}
              onChange={(e) => set('jurusan', e.target.value)}
            >
              <option value="">—</option>
              {withCurrent(JURUSAN, values.jurusan).map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              className="form-control"
              value={values.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Nomor HP</span>
            <input
              className="form-control"
              inputMode="numeric"
              maxLength={15}
              value={values.no_telepon ?? ''}
              onChange={(e) => set('no_telepon', e.target.value.replace(/\D/g, '').slice(0, 15))}
            />
          </label>
        </div>

        <footer className="modal__foot">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default AlumniDialog;
