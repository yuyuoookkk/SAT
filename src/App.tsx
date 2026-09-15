import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormWizard from './pages/FormWizard';
import AuthPage from './pages/AuthPage';
import Overview from './pages/admin/Overview';
import AkunSiswa from './pages/admin/AkunSiswa';
import DataKuisioner from './pages/admin/DataKuisioner';
import RequireAdmin from './components/admin/RequireAdmin';
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
              <div className="app-container">
                <FormWizard />
              </div>
            }
          />

          {/* Admin */}
          {/* Combined entry point: pick Admin or User, then log in or sign up. */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/masuk" element={<Navigate to="/auth" replace />} />
          {/* Kept so existing links and bookmarks still work. */}
          <Route
            path="/admin/login"
            element={<Navigate to="/auth?role=admin" replace />}
          />
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
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
