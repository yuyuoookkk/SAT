import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, Mail } from 'lucide-react';
import { useAdminAuth } from '../../lib/adminAuthContext';

const Login = () => {
  const { session, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email atau kata sandi salah.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <span className="admin-login__logo" aria-hidden="true">SMK</span>
        <h1>Admin Tracer Study</h1>
        <p>Masuk untuk mengelola data alumni SMK TI Bali Global Jimbaran.</p>

        {error && (
          <p className="admin-error">
            <AlertTriangle size={16} />
            {error}
          </p>
        )}

        <div className="field">
          <label className="field__label" htmlFor="admin-email">Email</label>
          <div className="field__control">
            <span className="field__icon" aria-hidden="true"><Mail size={18} /></span>
            <input
              id="admin-email"
              type="email"
              className="form-control form-control--with-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smktibaliglobaljimbaran.sch.id"
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="admin-password">Kata Sandi</label>
          <div className="field__control">
            <span className="field__icon" aria-hidden="true"><Lock size={18} /></span>
            <input
              id="admin-password"
              type="password"
              className="form-control form-control--with-icon"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
};

export default Login;
