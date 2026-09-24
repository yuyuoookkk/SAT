import { CheckCircle2, Info, Mail } from 'lucide-react';
import labKomputer from '../../assets/photos/lab-komputer.jpg';

interface Props {
  title: string;
  paragraphs: string[];
  bullets: string[];
}

/**
 * The explanatory rail beside the questionnaire.
 *
 * Answers the question every form provokes and few forms address: why are you
 * asking me this? Each step passes its own wording, so the reason shown is the
 * reason for the questions actually on screen.
 *
 * Alumni fill this in voluntarily, months or years after leaving. Telling them
 * the data feeds accreditation and curriculum review is the difference between
 * a form completed and a form closed.
 *
 * Hidden on step 1, where the questions are self-explanatory, and on the
 * confirmation screen, where there is nothing left to justify.
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

    <figure className="aside-photo">
      <img
        src={labKomputer}
        alt="Siswa dan guru SMK TI Bali Global Jimbaran bekerja bersama di laboratorium komputer"
        loading="lazy"
        width={850}
        height={489}
      />
      <figcaption>Laboratorium Komputer</figcaption>
    </figure>
  </aside>
);

export default FormAside;
