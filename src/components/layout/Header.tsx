import { Link } from 'react-router-dom';

/**
 * Top app bar — Figma node 3428:823 / 3435:385.
 *
 * The crest artwork could not be exported from Figma in this environment, so
 * the mark falls back to a monogram badge. Drop the real file into
 * `src/assets/` and swap the `<span>` for an `<img className="topbar__logo">`.
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

      <nav className="topbar__nav">
        <Link className="topbar__link" to="/">
          Beranda
        </Link>
        <a className="topbar__link" href="#tentang">
          Tentang
        </a>
        <a className="topbar__link" href="#statistik">
          Statistik
        </a>
        <Link className="btn btn-accent" to="/tracer-form">
          Isi Tracer Study
        </Link>
      </nav>
    </div>
  </header>
);

export default Header;
