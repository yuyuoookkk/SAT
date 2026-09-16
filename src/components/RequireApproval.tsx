import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw, ShieldX } from 'lucide-react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import { useAdminAuth } from '../lib/adminAuthContext';

/**
 * Gate for the questionnaire: a signed-in account is not enough, an admin must
 * have approved it (migration 0008).
 *
 * Unlike RequireAuth this does not redirect. Being sent back to a login page
 * you are already past reads as a bug; the alumnus has done everything asked of
 * them and is waiting on the school, so the page says so.
 *
 * `approval === null` means the check has not resolved — see AdminAuthProvider.
 * That case falls through to the form, because the INSERT policy is the real
 * boundary and a silent lockout would be worse than a refused submission.
 */
const RequireApproval = ({ children }: { children: ReactNode }) => {
  const { approval, refreshApproval } = useAdminAuth();
  const [checking, setChecking] = useState(false);

  const recheck = async () => {
    setChecking(true);
    try {
      await refreshApproval();
    } finally {
      setChecking(false);
    }
  };

  if (approval !== 'pending' && approval !== 'rejected') return <>{children}</>;

  const rejected = approval === 'rejected';

  return (
    <div className="app-container">
      <Header />
      <main className="gatepage">
        <div className={`gatepage__card${rejected ? ' gatepage__card--stop' : ''}`}>
          <span className="gatepage__icon" aria-hidden="true">
            {rejected ? <ShieldX size={28} /> : <Clock size={28} />}
          </span>

          <h1>{rejected ? 'Pendaftaran Belum Disetujui' : 'Menunggu Persetujuan Admin'}</h1>

          <p>
            {rejected ? (
              <>
                Akun Anda belum dapat digunakan untuk mengisi kuisioner Tracer Study. Jika Anda
                yakin ini keliru, hubungi Bursa Kerja Khusus (BKK) SMK TI Bali Global Jimbaran
                dengan menyebutkan NISN dan tahun kelulusan Anda.
              </>
            ) : (
              <>
                Akun Anda sudah dibuat. Sebelum dapat mengisi kuisioner, admin sekolah perlu
                memverifikasi bahwa Anda benar alumni SMK TI Bali Global Jimbaran.
              </>
            )}
          </p>

          {!rejected && (
            <p className="gatepage__note">
              Anda akan dapat langsung mengisi kuisioner begitu akun disetujui — cukup masuk
              kembali ke halaman ini.
            </p>
          )}

          <div className="gatepage__actions">
            {!rejected && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void recheck()}
                disabled={checking}
              >
                <RefreshCw size={16} />
                {checking ? 'Memeriksa…' : 'Periksa Status'}
              </button>
            )}
            <Link className="btn btn-light" to="/">
              <ArrowLeft size={16} />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequireApproval;
