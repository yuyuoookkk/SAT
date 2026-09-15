import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';

/** Slim public top bar: brand on the left, utilities on the right. */
const Header = () => (
  <header className="topbar">
    <div className="container topbar__inner">
      <Link to="/" className="topbar__brand">
        <span className="topbar__logo topbar__logo--fallback" aria-hidden="true">
          SMK
        </span>
        <span className="topbar__name">SMK TI Bali Global Jimbaran</span>
      </Link>

      <div className="topbar__tools">
        <button type="button" className="topbar__icon" aria-label="Notifikasi">
          <Bell size={18} />
        </button>
        <Link to="/auth" className="topbar__icon" aria-label="Masuk atau pengaturan akun">
          <Settings size={18} />
        </Link>
      </div>
    </div>
  </header>
);

export default Header;
