import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  GraduationCap,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '../lib/adminAuthContext';
import { JENIS_KELAMIN, JURUSAN } from '../lib/tracerStudy';

type Role = 'user' | 'admin';
type Mode = 'login' | 'signup';

const COPY: Record<Role, { title: string; blurb: string; after: string }> = {
  user: {
    title: 'Alumni',
    blurb: 'Masuk untuk mengisi kuisioner Tracer Study dan melihat data Anda.',
    after: '/tracer-form',
  },
  admin: {
    title: 'Admin',
    blurb: 'Masuk untuk mengelola data alumni SMK TI Bali Global Jimbaran.',
    after: '/admin',
  },
};

const AuthPage = () => {
  const { session, isAdmin, signIn, signUp } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  // Where the guard bounced them from, so they land back there afterwards.
  const nav = location.state as { from?: string; reason?: string } | null;
  const returnTo = nav?.from;
  const sentFromForm = nav?.reason === 'form';

  const role: Role = params.get('role') === 'admin' ? 'admin' : 'user';
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');

  // Admin accounts are not self-service. Membership of the allowlist is what
  // makes an admin (migration 0002), and a sign-up form that cannot grant it
  // only teaches people to expect an account that never arrives. So the Daftar
  // tab is not offered for this role, and a URL asking for it is ignored.
  const signUpAllowed = role === 'user';
  const effectiveMode: Mode = signUpAllowed ? mode : 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // Collected on sign-up only, and only for alumni: an admin approving a
  // request needs something to check it against, and an email address alone is
  // not it. These go to migrations 0008/0009 and are matched to the roster.
  const [fullName, setFullName] = useState('');
  const [nisn, setNisn] = useState('');
  const [nik, setNik] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in: send them where they were trying to go.
  if (session && !notice) {
    return <Navigate to={returnTo ?? (role === 'admin' ? '/admin' : '/tracer-form')} replace />;
  }

  const setRole = (next: Role) => {
    setParams({ role: next, mode }, { replace: true });
    setError(null);
    setNotice(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setParams({ role, mode: next }, { replace: true });
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (effectiveMode === 'signup' && password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (effectiveMode === 'signup' && password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }

    setBusy(true);
    try {
      if (effectiveMode === 'login') {
        await signIn(email, password);
        navigate(returnTo ?? COPY[role].after, { replace: true });
        return;
      }

      const activeNow = await signUp(email, password, {
        fullName,
        nisn,
        nik,
        jurusan,
        jenisKelamin,
        noTelepon,
      });

      if (!activeNow) {
        setNotice(
          'Akun dibuat. Silakan cek email Anda untuk tautan konfirmasi, lalu masuk. ' +
            'Setelah itu admin sekolah akan memverifikasi pendaftaran Anda.',
        );
        return;
      }

      if (role === 'admin') {
        // Signing up never grants admin rights — see migration 0002. The
        // account exists, but an existing admin must add it to the allowlist.
        setNotice(
          'Akun admin dibuat, tetapi akses belum aktif. Hubungi admin yang sudah terdaftar ' +
            'untuk menambahkan akun ini ke daftar admin.',
        );
        return;
      }

      // Alumni sign-ups land on the waiting screen rather than the form — the
      // account exists but cannot submit until an admin approves it (0008).
      navigate(returnTo ?? COPY[role].after, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className={`auth__card${effectiveMode === 'signup' ? ' auth__card--wide' : ''}`}>
        <button type="button" className="auth__back" onClick={() => navigate('/')}>
          <ArrowLeft size={15} />
          Kembali ke Beranda
        </button>

        <span className="auth__logo" aria-hidden="true">SMK</span>
        <h1>Tracer Study Alumni</h1>
        <p className="auth__blurb">{COPY[role].blurb}</p>

        {sentFromForm && (
          <p className="auth__hint">
            Kuisioner Tracer Study hanya dapat diisi setelah masuk, agar jawaban Anda tersimpan
            atas nama Anda dan dapat diverifikasi oleh sekolah.
          </p>
        )}

        {/* The two role buttons */}
        <div className="auth__roles" role="tablist" aria-label="Pilih jenis akun">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'user'}
            className={`auth__role${role === 'user' ? ' is-active' : ''}`}
            onClick={() => setRole('user')}
          >
            <User size={20} />
            <span>User</span>
            <small>Alumni</small>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'admin'}
            className={`auth__role${role === 'admin' ? ' is-active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <ShieldCheck size={20} />
            <span>Admin</span>
            <small>Pengelola</small>
          </button>
        </div>

        {/* Login / sign-up switch — admins log in only. */}
        {signUpAllowed && (
          <div className="auth__modes">
            <button
              type="button"
              className={`auth__mode${effectiveMode === 'login' ? ' is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Masuk
            </button>
            <button
              type="button"
              className={`auth__mode${effectiveMode === 'signup' ? ' is-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Daftar
            </button>
          </div>
        )}

        {error && (
          <p className="admin-error">
            <AlertTriangle size={16} />
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-notice">
            <CheckCircle2 size={16} />
            {notice}
          </p>
        )}

        {role === 'admin' && !notice && (
          <p className="auth__hint">
            Akun admin tidak dapat didaftarkan sendiri. Untuk menambah admin baru, admin yang
            sudah terdaftar harus memasukkan akunnya ke daftar admin.
          </p>
        )}

        {role === 'user' && effectiveMode === 'signup' && !notice && (
          <p className="auth__hint">
            Isi data sesuai ijazah dan kartu identitas. Admin sekolah akan mencocokkannya
            dengan data induk alumni — kuisioner baru dapat diisi setelah pendaftaran disetujui.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {effectiveMode === 'signup' && (
            <div className="auth__grid">
              <div className="field field--wide">
                <label className="field__label" htmlFor="auth-name">
                  Nama Lengkap (Sesuai Ijazah)
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><User size={18} /></span>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    className="form-control form-control--with-icon"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: I Putu Gede Prasetya"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="auth-nisn">
                  NISN
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><IdCard size={18} /></span>
                  <input
                    id="auth-nisn"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="form-control form-control--with-icon"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10 digit nomor NISN"
                    minLength={10}
                    maxLength={10}
                    required
                  />
                </div>
                <span className="field__hint">Dicocokkan dengan data induk alumni.</span>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="auth-nik">
                  NIK
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><Fingerprint size={18} /></span>
                  <input
                    id="auth-nik"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="form-control form-control--with-icon"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 digit sesuai KTP"
                    minLength={16}
                    maxLength={16}
                    required
                  />
                </div>
                <span className="field__hint">Tepat 16 digit angka.</span>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="auth-jurusan">
                  Kompetensi Keahlian (Jurusan)
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><GraduationCap size={18} /></span>
                  <select
                    id="auth-jurusan"
                    className="form-control form-control--with-icon"
                    value={jurusan}
                    onChange={(e) => setJurusan(e.target.value)}
                    required
                  >
                    <option value="">Pilih Jurusan</option>
                    {JURUSAN.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="auth-jk">
                  Jenis Kelamin
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><Users size={18} /></span>
                  <select
                    id="auth-jk"
                    className="form-control form-control--with-icon"
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    {JENIS_KELAMIN.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="field field--wide">
                <label className="field__label" htmlFor="auth-hp">
                  Nomor WhatsApp Aktif
                  <span aria-hidden="true" className="field__req">*</span>
                </label>
                <div className="field__control">
                  <span className="field__icon" aria-hidden="true"><Phone size={18} /></span>
                  <input
                    id="auth-hp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="form-control form-control--with-icon"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="0812xxxxxxx"
                    minLength={9}
                    maxLength={15}
                    required
                  />
                </div>
                <span className="field__hint">
                  Dipakai sekolah untuk menghubungi Anda bila data perlu dikonfirmasi.
                </span>
              </div>
            </div>
          )}

          <div className="field field--wide">
            <label className="field__label" htmlFor="auth-email">Email Aktif</label>
            <div className="field__control">
              <span className="field__icon" aria-hidden="true"><Mail size={18} /></span>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                className="form-control form-control--with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="auth-password">Kata Sandi</label>
            <div className="field__control">
              <span className="field__icon" aria-hidden="true"><Lock size={18} /></span>
              <input
                id="auth-password"
                type="password"
                autoComplete={effectiveMode === 'login' ? 'current-password' : 'new-password'}
                className="form-control form-control--with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={effectiveMode === 'signup' ? 8 : undefined}
                required
              />
            </div>
            {effectiveMode === 'signup' && (
              <span className="field__hint">Minimal 8 karakter.</span>
            )}
          </div>

          {effectiveMode === 'signup' && (
            <div className="field">
              <label className="field__label" htmlFor="auth-confirm">Ulangi Kata Sandi</label>
              <div className="field__control">
                <span className="field__icon" aria-hidden="true"><Lock size={18} /></span>
                <input
                  id="auth-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="form-control form-control--with-icon"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary auth__submit" disabled={busy}>
            {busy
              ? 'Memproses…'
              : effectiveMode === 'login'
                ? `Masuk sebagai ${COPY[role].title}`
                : `Daftar sebagai ${COPY[role].title}`}
          </button>
        </form>

        {role === 'user' && effectiveMode === 'login' && (
          <p className="auth__alt">
            Belum punya akun?{' '}
            <button type="button" className="auth__link" onClick={() => switchMode('signup')}>
              Daftar di sini
            </button>
            . Pendaftaran perlu disetujui admin sebelum kuisioner dapat diisi.
          </p>
        )}

        {session && isAdmin === false && role === 'admin' && (
          <p className="auth__hint">
            Akun ini sudah masuk tetapi belum terdaftar sebagai admin.
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
