import { Globe, Mail } from 'lucide-react';

/** Footer — Figma node 3428:329. */
const Footer = () => (
  <footer className="footer">
    <div className="container footer__inner">
      <div>
        <p className="footer__brand">SMK TI Bali Global Jimbaran</p>
        <p className="footer__tagline">
          Sekolah Menengah Kejuruan Teknologi Informasi terbaik di wilayah Kuta Selatan, Bali.
        </p>
      </div>

      <nav className="footer__links">
        <a href="#privacy">Privacy Policy</a>
        <a href="#support">Contact Support</a>
        <a href="#alumni">Alumni Portal</a>
      </nav>

      <div className="footer__social">
        <a href="#website" aria-label="Website sekolah">
          <Globe size={17} />
        </a>
        <a href="#email" aria-label="Email sekolah">
          <Mail size={17} />
        </a>
      </div>

      <p className="footer__legal">
        &copy; {new Date().getFullYear()} SMK TI Bali Global Jimbaran. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
