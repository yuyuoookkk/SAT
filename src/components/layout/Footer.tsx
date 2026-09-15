import { Link } from 'react-router-dom';
import { Globe, Mail } from 'lucide-react';

/** Four-column public footer. */
const Footer = () => (
  <footer className="sitefoot">
    <div className="container sitefoot__grid">
      <div className="sitefoot__brand">
        <span className="sitefoot__logo" aria-hidden="true">SMK</span>
        <p>
          Portal Tracer Study resmi SMK TI Bali Global Jimbaran. Menjembatani alumni, industri,
          dan institusi pendidikan.
        </p>
      </div>

      <nav aria-labelledby="foot-menu">
        <h2 id="foot-menu">Menu</h2>
        <ul>
          <li><Link to="/tracer-form">Isi Data Baru</Link></li>
          <li><a href="#statistik">Statistik Publik</a></li>
          <li><a href="#panduan">Panduan Pengisian</a></li>
        </ul>
      </nav>

      <nav aria-labelledby="foot-info">
        <h2 id="foot-info">Informasi</h2>
        <ul>
          <li><a href="#privacy">Kebijakan Privasi</a></li>
          <li><a href="#terms">Syarat &amp; Ketentuan</a></li>
          <li><a href="#kontak">Kontak Admin</a></li>
        </ul>
      </nav>

      <section aria-labelledby="foot-sekretariat">
        <h2 id="foot-sekretariat">Sekretariat</h2>
        <p>Bursa Kerja Khusus (BKK)</p>
        <p>SMK TI Bali Global Jimbaran</p>
        <p>
          Email:{' '}
          <a href="mailto:bkk@smktibgjimbaran.sch.id">bkk@smktibgjimbaran.sch.id</a>
        </p>
      </section>
    </div>

    <div className="container sitefoot__base">
      <p>&copy; {new Date().getFullYear()} – SMK TI Bali Global Jimbaran</p>
      <div className="sitefoot__social">
        <a href="#website" aria-label="Website sekolah"><Globe size={15} /></a>
        <a href="#email" aria-label="Email sekolah"><Mail size={15} /></a>
      </div>
    </div>
  </footer>
);

export default Footer;
