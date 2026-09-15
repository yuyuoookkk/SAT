import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Handshake,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { fetchPublicStats } from '../lib/adminData';
import type { PublicStats } from '../lib/adminData';
import { formatNumber } from '../lib/format';

/**
 * Bento statistics inside the hero — Figma node 3431:47.
 *
 * The first two are live figures from the database; the last two describe the
 * platform rather than the data, so they stay fixed.
 */
const bentoFor = (s: PublicStats | null) => [
  {
    icon: Users,
    value: s ? formatNumber(s.total_alumni) : '—',
    caption: 'Total Alumni Terdata',
  },
  {
    icon: Briefcase,
    value: s ? `${s.pct_bekerja}%` : '—',
    caption: 'Keterserapan Industri',
  },
  { icon: ShieldCheck, value: '100%', caption: 'Keamanan Data Alumni' },
  { icon: LineChart, value: 'Real-time', caption: 'Dashboard Statistik' },
];

/** "Mengapa Mengisi Tracer Study?" — Figma node 3428:675. */
const features = [
  {
    icon: Handshake,
    title: 'Pemetaan Karir Alumni',
    body: 'Memudahkan sekolah dalam menjalin kerjasama strategis dengan perusahaan tempat Anda bekerja.',
  },
  {
    icon: Sparkles,
    title: 'Evaluasi Kurikulum',
    body: 'Mengukur sejauh mana materi yang diajarkan masih relevan dengan kebutuhan industri saat ini.',
  },
  {
    icon: Rocket,
    title: 'Akreditasi & Mutu',
    body: 'Menjadi bukti penjaminan mutu pendidikan yang dipakai langsung dalam proses akreditasi sekolah.',
  },
];

/** "Gambaran Data Alumni" — Figma node 3428:710. */
const statsFor = (s: PublicStats | null) => [
  {
    icon: Briefcase,
    title: 'Penempatan Kerja',
    body: 'Persentase alumni yang telah terserap di Dunia Usaha dan Dunia Industri (DUDI).',
    value: s ? `${s.pct_bekerja}%` : '—',
    pill: 'Terserap Kerja',
    tint: 'var(--brand-100)',
    tone: 'var(--brand-700)',
    pillBg: 'rgba(11, 94, 215, 0.1)',
  },
  {
    icon: GraduationCap,
    title: 'Studi Lanjut',
    body: 'Persentase alumni yang melanjutkan ke jenjang Pendidikan Tinggi atau Vokasi.',
    value: s ? `${s.pct_kuliah}%` : '—',
    pill: 'Kuliah',
    tint: 'var(--violet-200)',
    tone: 'var(--violet-600)',
    pillBg: 'rgba(177, 136, 255, 0.1)',
  },
  {
    icon: Rocket,
    title: 'Wirausaha Mandiri',
    body: 'Persentase alumni yang berhasil membangun usaha mandiri atau startup kreatif.',
    value: s ? `${s.pct_wirausaha}%` : '—',
    pill: 'Entrepreneur',
    tint: 'var(--gold-200)',
    tone: 'var(--gold-900)',
    pillBg: 'rgba(129, 96, 0, 0.1)',
  },
];

const LandingPage = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPublicStats()
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        // The page is still perfectly readable without live figures; showing a
        // dash beats blocking the whole landing page on one query.
      });
    return () => {
      alive = false;
    };
  }, []);

  const bento = bentoFor(stats);
  const statCards = statsFor(stats);

  return (
    <>
    <Header />

    <main className="main-content animate-fade-in">
      {/* Hero — Figma node 3431:4 */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__badge">Khusus Alumni SMK TI Jimbaran</span>
            <h1>
              Pusat Data &amp;
              <br />
              <span>Tracer Study Alumni</span>
            </h1>
            <p className="hero__lede">
              Selamat datang di portal resmi pelacakan jejak alumni. Platform ini didedikasikan untuk
              mengumpulkan data karir dan pendidikan lanjut Anda guna memajukan kualitas almamater.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-accent" to="/tracer-form">
                Mulai Isi Tracer Study
                <ArrowRight size={16} />
              </Link>
              <a className="btn btn-onblue" href="#statistik">
                Lihat Panduan Data
              </a>
            </div>
          </div>

          <div className="bento">
            {bento.map(({ icon: Icon, value, caption }) => (
              <div className="bento__card" key={caption}>
                <span className="bento__icon">
                  <Icon size={26} />
                </span>
                <div>
                  <p className="bento__value">{value}</p>
                  <p className="bento__caption">{caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tentang Tracer Study — Figma node 3428:668 */}
      <section className="section section--muted" id="tentang">
        <div className="container">
          <div className="section-head">
            <h2>Mengapa Mengisi Tracer Study?</h2>
            <p>
              Data yang Anda berikan adalah kunci utama bagi sekolah untuk melakukan evaluasi
              berkelanjutan. Melalui Tracer Study, kami dapat mengukur sejauh mana kurikulum kami
              relevan dengan kebutuhan industri masa kini.
            </p>
          </div>

          <div className="feature-list">
            {features.map(({ icon: Icon, title, body }) => (
              <article className="feature" key={title}>
                <span className="feature__icon">
                  <Icon size={24} />
                </span>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Statistik Alumni — Figma node 3428:703 */}
      <section className="section section--sunken" id="statistik">
        <div className="container">
          <div className="section-head">
            <h2>Gambaran Data Alumni</h2>
            <p>
              Data statistik real-time yang dihasilkan dari partisipasi aktif alumni dalam mengisi
              Tracer Study.
            </p>
          </div>

          <div className="stat-grid">
            {statCards.map(({ icon: Icon, title, body, value, pill, tint, tone, pillBg }) => (
              <article className="stat-card" key={title}>
                <span className="stat-card__icon" style={{ backgroundColor: tint, color: tone }}>
                  <Icon size={23} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
                <div className="stat-card__foot">
                  <span className="stat-card__value" style={{ color: tone }}>
                    {value}
                  </span>
                  <span className="stat-card__pill" style={{ backgroundColor: pillBg, color: tone }}>
                    {pill}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action — Figma node 3428:750 */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <div className="cta__inner">
              <h2>Belum Mengisi Tracer Study Tahun Ini?</h2>
              <p>
                Partisipasi Anda hanya membutuhkan waktu kurang dari 10 menit namun berdampak besar
                bagi masa depan almamater.
              </p>
              <Link className="btn btn-light" to="/tracer-form">
                Mulai Isi Data Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </>
  );
};

export default LandingPage;
