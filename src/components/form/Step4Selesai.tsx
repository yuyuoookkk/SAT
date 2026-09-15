import type React from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, Home } from 'lucide-react';

/** Step 4 — Figma node 3442:956 ("Berhasil Dikirim!"). */
const Step4Selesai: React.FC = () => (
  <div className="done animate-fade-in">
    <div className="done__badge">
      <Check size={80} strokeWidth={2.5} />
      <span className="done__chip" aria-hidden="true" />
      <span className="done__blob" aria-hidden="true" />
    </div>

    <h1>Berhasil Dikirim!</h1>
    <p className="done__lede">
      Terima kasih telah mengisi Tracer Study. Data Anda sangat berharga bagi pengembangan kualitas
      akademik SMK TI Bali Global Jimbaran.
    </p>

    <div className="done__actions done__actions--row">
      <button type="button" className="btn btn-primary" onClick={() => window.print()}>
        <Download size={16} />
        Download Bukti Pengisian (PDF)
      </button>
      <Link className="btn btn-outline" to="/">
        <Home size={16} />
        Kembali ke Beranda
      </Link>
    </div>

  </div>
);

export default Step4Selesai;
