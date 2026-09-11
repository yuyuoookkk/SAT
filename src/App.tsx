import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormWizard from './pages/FormWizard';
import Login from './pages/admin/Login';
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
          <Route path="/admin/login" element={<Login />} />
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
