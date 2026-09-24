import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../../lib/adminAuthContext';

/**
 * Gate for every /admin route.
 *
 * Three outcomes, deliberately different:
 *
 *   not signed in   → redirect to the admin login
 *   signed in, not on the allowlist → say so, and offer to sign out
 *   signed in and an admin          → through
 *
 * The middle case explains rather than redirects. Bouncing a signed-in person
 * back to a login page they just completed reads as a broken site; telling
 * them the account is not an admin is the actual answer.
 *
 * `isAdmin === null` means the check has not resolved — a failed call, or
 * migration 0002 not applied — and is let through on purpose. The RLS policies
 * are the real boundary, so a dashboard that returns no rows is a far better
 * failure than locking out a correctly configured admin.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { session, loading, isAdmin, signOut } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-boot">
        <span className="spinner" aria-hidden="true" />
        <p>Memuat sesi…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth?role=admin" state={{ from: location.pathname }} replace />;
  }

  // Signed in, but not on the allowlist: say so plainly instead of showing a
  // dashboard full of zeroes, which is what the row-level policies would
  // otherwise return.
  if (isAdmin === false) {
    return (
      <div className="admin-boot">
        <ShieldAlert size={36} aria-hidden="true" />
        <h1 style={{ fontSize: 20 }}>Akun ini bukan admin</h1>
        <p style={{ maxWidth: 420, textAlign: 'center' }}>
          Akun <strong>{session.user?.email}</strong> tidak terdaftar sebagai admin Tracer
          Study. Hubungi admin sekolah untuk meminta akses.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => {
            void signOut().then(() => navigate('/auth?role=admin', { replace: true }));
          }}
        >
          Keluar
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
