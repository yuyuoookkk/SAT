import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuthContext';

/** Gate for every /admin route. */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
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
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
