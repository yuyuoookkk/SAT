import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Step4Selesai: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <div style={{ 
        color: 'var(--success-color)', 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <CheckCircle size={80} strokeWidth={1.5} />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Terima Kasih!</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
        Data Tracer Study Anda telah berhasil disimpan. Partisipasi Anda sangat berarti bagi pengembangan kualitas pendidikan di SMK TI Bali Global Jimbaran.
      </p>

      <button 
        className="btn btn-primary"
        onClick={() => navigate('/')}
        style={{ padding: '1rem', fontSize: '1.1rem' }}
      >
        Kembali ke Beranda
      </button>
    </div>
  );
};

export default Step4Selesai;
