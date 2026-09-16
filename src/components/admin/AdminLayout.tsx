import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, ClipboardList, LayoutGrid, LogOut, Search, UserCheck, Users } from 'lucide-react';
import { useAdminAuth } from '../../lib/adminAuthContext';
import { countPendingRequests } from '../../lib/adminData';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/akun-siswa', label: 'Akun Siswa', icon: Users, end: false },
  { to: '/admin/data-kuisioner', label: 'Data Kuisioner', icon: ClipboardList, end: false },
  { to: '/admin/persetujuan', label: 'Persetujuan', icon: UserCheck, end: false },
];

interface Props {
  children: ReactNode;
  /** Shown in the top bar; omitted on screens that have their own search. */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
}

const AdminLayout = ({ children, search }: Props) => {
  const { session, signOut } = useAdminAuth();
  const navigate = useNavigate();

  // Sign-ups waiting on a decision. Shown as a badge because an approval queue
  // nobody looks at is the same as no approval at all. A failed count (0008 not
  // applied) simply shows no badge.
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let alive = true;
    countPendingRequests()
      .then((n) => { if (alive) setPending(n); })
      .catch(() => { if (alive) setPending(0); });
    return () => { alive = false; };
  }, []);

  const email = session?.user?.email ?? 'admin';
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth?role=admin', { replace: true });
  };

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <nav className="admin-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav__item${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} />
              {label}
              {to === '/admin/persetujuan' && pending > 0 && (
                <span className="admin-nav__badge" aria-label={`${pending} menunggu persetujuan`}>
                  {pending}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="admin-nav__item admin-nav__logout" onClick={handleSignOut}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar__logo" aria-hidden="true">
            SMK
          </span>

          {search ? (
            <label className="admin-search">
              <Search size={16} />
              <input
                type="search"
                value={search.value}
                placeholder={search.placeholder ?? 'Search alumni...'}
                onChange={(e) => search.onChange(e.target.value)}
              />
            </label>
          ) : (
            <span className="admin-topbar__spacer" />
          )}

          <button type="button" className="admin-topbar__bell" aria-label="Notifikasi">
            <Bell size={18} />
          </button>

          <div className="admin-user">
            <span className="admin-user__meta">
              <span className="admin-user__name">Admin</span>
              <span className="admin-user__role">{email}</span>
            </span>
            <span className="admin-user__avatar" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="admin-canvas">{children}</main>

        <footer className="admin-footer">
          <div>
            <p className="admin-footer__brand">SMK TI Bali Global</p>
            <p className="admin-footer__legal">
              &copy; {new Date().getFullYear()} SMK TI Bali Global Jimbaran – Alumni Tracer Study
              System
            </p>
          </div>
          <nav className="admin-footer__links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact School</a>
            <a href="#portal">Alumni Portal</a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
