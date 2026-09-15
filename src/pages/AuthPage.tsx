import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useAdminAuth } from '../lib/adminAuthContext';

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
  const [params, setParams] = useSearchParams();

  const role: Role = params.get('role') === 'admin' ? 'admin' : 'user';
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in: send them where they were trying to go.
  if (session && !notice) {
    return <Navigate to={role === 'admin' ? '/admin' : '/tracer-form'} replace />;
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

    if (mode === 'signup' && password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate(COPY[role].after, { replace: true });
        return;
      }

      const activeNow = await signUp(email, password);

      if (!activeNow) {
        setNotice(
          'Akun dibuat. Silakan cek email Anda untuk tautan konfirmasi sebelum masuk.',
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

      navigate(COPY[role].after, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <button type="button" className="auth__back" onClick={() => navigate('/')}>
          <ArrowLeft size={15} />
          Kembali ke Beranda
        </button>

        <span className="auth__logo" aria-hidden="true">SMK</span>
        <h1>Tracer Study Alumni</h1>
        <p className="auth__blurb">{COPY[role].blurb}</p>

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

        {/* Login / sign-up switch */}
        <div className="auth__modes">
          <button
            type="button"
            className={`auth__mode${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Masuk
          </button>
          <button
            type="button"
            className={`auth__mode${mode === 'signup' ? ' is-active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Daftar
          </button>
        </div>

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

        {role === 'admin' && mode === 'signup' && !notice && (
          <p className="auth__hint">
            Mendaftar tidak otomatis memberikan akses admin. Akun baru harus ditambahkan ke
            daftar admin oleh admin yang sudah ada.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="auth-email">Email</label>
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="form-control form-control--with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'signup' ? 8 : undefined}
                required
              />
            </div>
            {mode === 'signup' && (
              <span className="field__hint">Minimal 8 karakter.</span>
            )}
          </div>

          {mode === 'signup' && (
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
              : mode === 'login'
                ? `Masuk sebagai ${COPY[role].title}`
                : `Daftar sebagai ${COPY[role].title}`}
          </button>
        </form>

        {role === 'user' && mode === 'login' && (
          <p className="auth__alt">
            Belum punya akun?{' '}
            <button type="button" className="auth__link" onClick={() => switchMode('signup')}>
              Daftar di sini
            </button>
            . Anda juga bisa mengisi kuisioner tanpa akun.
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
