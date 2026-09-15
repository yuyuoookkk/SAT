import { CheckCircle2, Info, Mail } from 'lucide-react';

interface Props {
  title: string;
  paragraphs: string[];
  bullets: string[];
}

/**
 * The explanatory rail beside the wizard. The photo panel is a branded
 * placeholder: the campus photograph in the design could not be exported from
 * Figma, so drop a real image at src/assets/campus.jpg and swap the <span> for
 * an <img> when you have it.
 */
const FormAside = ({ title, paragraphs, bullets }: Props) => (
  <aside className="form-aside">
    <section className="aside-card aside-card--info">
      <span className="aside-card__icon" aria-hidden="true">
        <Info size={18} />
      </span>
      <h2>{title}</h2>
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <ul>
        {bullets.map((b) => (
          <li key={b}>
            <CheckCircle2 size={14} aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
    </section>

    <section className="aside-card">
      <h2>Butuh Bantuan?</h2>
      <p>
        Jika Anda memiliki kendala dalam mengisi form ini, silakan hubungi tim Tracer Study kami.
      </p>
      <a className="btn btn-outline aside-card__cta" href="mailto:bkk@smktibgjimbaran.sch.id">
        <Mail size={15} />
        Hubungi Admin
      </a>
    </section>

    <span className="aside-photo" role="img" aria-label="Foto kegiatan alumni SMK TI Bali Global Jimbaran">
      <span>Our Campus</span>
    </span>
  </aside>
);

export default FormAside;
