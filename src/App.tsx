/* =============================================================================
 * Route map — the whole application in one file.
 *
 * Every page of the system hangs off this table, and the guards wrapped around
 * each route are what decide who may see it. Reading top to bottom:
 *
 *   /                     Landing page. Open to anyone, signed in or not.
 *   /tracer-form          The questionnaire. Two guards deep — see below.
 *   /auth                 Sign in / sign up, for both alumni and admins.
 *   /admin/*              The four dashboard screens, admins only.
 *
 * THE THREE GUARDS
 *
 *   RequireAuth       Is anyone signed in? If not, bounce to /auth and
 *                     remember where they were headed.
 *   RequireApproval   Has an admin approved this account? If not, show the
 *                     "menunggu persetujuan" screen instead of the form.
 *   RequireAdmin      Is this account on the admin allowlist?
 *
 * The questionnaire carries the first two in sequence, which is the rule the
 * whole system turns on: an account is not enough, it has to be an approved
 * one. RequireAuth redirects (you can fix being signed out); RequireApproval
 * explains (you cannot fix waiting, so being sent back to a login you already
 * passed would read as a bug).
 *
 * WHAT THESE GUARDS ARE NOT
 *
 * They are courtesy, not security. They stop the honest path through the UI
 * and nothing more. The Supabase API key ships inside this bundle, so anyone
 * can call the REST endpoint directly and never load this file at all. The
 * real boundary is the Row Level Security policies in supabase/migrations —
 * every guard here has a policy behind it doing the actual enforcing.
 *
 * AdminAuthProvider wraps the lot so one session is shared by every page
 * rather than each refetching it.
 * ========================================================================== */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormWizard from './pages/FormWizard';
import AuthPage from './pages/AuthPage';
import Overview from './pages/admin/Overview';
import AkunSiswa from './pages/admin/AkunSiswa';
import DataKuisioner from './pages/admin/DataKuisioner';
import Persetujuan from './pages/admin/Persetujuan';
import RequireAdmin from './components/admin/RequireAdmin';
import RequireAuth from './components/RequireAuth';
import RequireApproval from './components/RequireApproval';
import { AdminAuthProvider } from './lib/AdminAuthProvider';

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Public alumni site */}
          <Route
            path="/"
            element={
              <div className="app-container">
                <LandingPage />
              </div>
            }
          />
          <Route
            path="/tracer-form"
            element={
              <RequireAuth>
                <RequireApproval>
                  <div className="app-container">
                    <FormWizard />
                  </div>
                </RequireApproval>
              </RequireAuth>
            }
          />

          {/* One entry point for both audiences: pick Admin or User on the
              page itself, then log in (or, for alumni only, sign up). */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Old addresses. Kept as redirects so links and bookmarks handed
              out before the pages were merged still land somewhere useful. */}
          <Route path="/masuk" element={<Navigate to="/auth" replace />} />
          <Route
            path="/admin/login"
            element={<Navigate to="/auth?role=admin" replace />}
          />

          {/* Admin dashboard. Every screen behind the same allowlist check. */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Overview />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/akun-siswa"
            element={
              <RequireAdmin>
                <AkunSiswa />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/data-kuisioner"
            element={
              <RequireAdmin>
                <DataKuisioner />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/persetujuan"
            element={
              <RequireAdmin>
                <Persetujuan />
              </RequireAdmin>
            }
          />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
