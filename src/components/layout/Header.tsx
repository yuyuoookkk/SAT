import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isForm = location.pathname.includes('/tracer-form');

  return (
    <header style={{
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '1.25rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px',
      boxShadow: '0 4px 12px rgba(30, 86, 160, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {isForm && (
        <button 
          onClick={() => navigate(-1)} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            marginRight: '1rem',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'white' }}>SMK TI Bali Global</h1>
        <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.9 }}>Jimbaran - Tracer Study Portal</p>
      </div>
    </header>
  );
};

export default Header;
