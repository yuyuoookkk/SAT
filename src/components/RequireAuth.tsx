import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../lib/adminAuthContext';

/**
 * Gate for pages that need any signed-in account (as opposed to RequireAdmin,
 * which additionally needs allowlist membership).
 *
 * The questionnaire sits behind this so every response can be attributed to an
 * alumnus. The matching database policy lives in migration 0007 — this guard is
 * only the polite half of it.
 */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-boot">
        <span className="spinner" aria-hidden="true" />
        <p>Memuat sesi…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/auth?role=user"
        state={{ from: location.pathname, reason: 'form' }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
