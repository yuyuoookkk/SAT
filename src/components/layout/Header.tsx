import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';

/**
 * Public top bar — shown on the landing page, the questionnaire and the sign-in
 * page, so the alumni-facing half of the site feels like one place.
 *
 * The brand doubles as the way home, which is why the sign-in page needs no
 * separate "back" link. The gear leads to /auth: for a signed-out visitor that
 * is where you sign in, and for a signed-in one it is where the account lives.
 *
 * The admin dashboard has its own bar (AdminLayout) rather than reusing this
 * one — it needs search, notifications and the signed-in admin's identity,
 * none of which belong on a public page.
 */
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
