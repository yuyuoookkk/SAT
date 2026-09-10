const Footer = () => {
  return (
    <footer style={{
      padding: '2rem 1.25rem',
      textAlign: 'center',
      marginTop: 'auto',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Hubungi Kami</p>
        <p>Jl. Kampus Unud, Jimbaran</p>
        <p>Email: info@smktibaliglobaljimbaran.sch.id</p>
      </div>
      <p>&copy; {new Date().getFullYear()} SMK TI Bali Global Jimbaran.</p>
      <p>All rights reserved.</p>
    </footer>
  );
};

export default Footer;
