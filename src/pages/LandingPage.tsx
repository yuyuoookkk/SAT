import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Briefcase, GraduationCap, Building2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className="main-content container animate-fade-in" style={{ paddingTop: '1.5rem' }}>
        
        {/* Hero Section */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--primary-color) 0%, #3B82F6 100%)',
          color: 'white'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Selamat Datang, Alumni!</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
            Partisipasi Anda dalam Tracer Study ini sangat penting untuk pengembangan kurikulum dan peningkatan mutu sekolah kita.
          </p>
        </div>

        {/* Statistics Grid */}
        <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>Statistik Lulusan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ 
              background: '#E0F2FE', color: '#0284C7', 
              width: '48px', height: '48px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Briefcase size={24} />
            </div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--primary-color)' }}>65%</h4>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Bekerja</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ 
              background: '#FEF3C7', color: '#D97706', 
              width: '48px', height: '48px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <GraduationCap size={24} />
            </div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#D97706' }}>20%</h4>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Kuliah</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem', gridColumn: '1 / -1' }}>
            <div style={{ 
              background: '#DCFCE7', color: '#16A34A', 
              width: '48px', height: '48px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Building2 size={24} />
            </div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#16A34A' }}>15%</h4>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Wirausaha</p>
          </div>

        </div>

        {/* CTA Section */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Mulai Isi Tracer Study</h3>
          <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Hanya butuh waktu sekitar 5 menit. Data Anda akan dijaga kerahasiaannya.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/tracer-form')}
            style={{ padding: '1rem', fontSize: '1.1rem' }}
          >
            Mulai Pengisian
          </button>
        </div>

      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
