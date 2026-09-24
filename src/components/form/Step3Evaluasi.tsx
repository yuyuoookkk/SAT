import type React from 'react';
import { AlertTriangle, ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { RateRow, TextareaField } from './fields';
import type { FormData } from '../../lib/tracerStudy';
import { EVALUATION_ROWS } from '../../lib/tracerStudy';

interface Props {
  formData: FormData;
  setField: (name: string, value: string | number) => void;
  prevStep: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Questionnaire step 3 — "Evaluasi Kualitas Pendidikan" (Figma node 3442:410).
 *
 * Turns the questionnaire around: the first two steps asked what happened to
 * the alumnus, this one asks what they thought of the school that sent them
 * there. Ratings for teaching, industrial placement (PKL), skills and
 * discipline, plus free-text suggestions.
 *
 * This is the part that feeds accreditation and curriculum review, which is
 * why it is asked of everyone regardless of which branch they took in step 2.
 *
 * Ratings are 1-5 scales rather than free text so they can be averaged; the
 * satisfaction questions use faces instead of numbers, because "how satisfied
 * are you, from 1 to 5" invites a shrug where a row of faces invites a pick.
 */
const Step3Evaluasi: React.FC<Props> = ({
  formData,
  setField,
  prevStep,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const complete = EVALUATION_ROWS.every((row) => formData[row.name] !== undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="animate-fade-in" onSubmit={handleSubmit}>
      <div className="form-panel__head">
        <h3>Evaluasi Kualitas Pendidikan</h3>
        <p>
          Berikan umpan balik jujur Anda untuk membantu kami meningkatkan kualitas pendidikan dan
          relevansi kurikulum bagi generasi mendatang.
        </p>
      </div>

      <h4 className="form-section__title">Penilaian Fasilitas &amp; Layanan</h4>

      <div className="form-block">
        {EVALUATION_ROWS.map((row) => (
          <RateRow
            key={row.name}
            label={row.label}
            name={row.name}
            value={formData[row.name] as number | undefined}
            onChange={setField}
          />
        ))}
      </div>

      <div className="form-block" style={{ marginTop: 32 }}>
        <TextareaField
          label="Saran dan Masukan untuk Sekolah"
          name="saranMasukan"
          icon={MessageSquare}
          rows={5}
          placeholder="Tuliskan saran atau masukan Anda di sini..."
          value={(formData.saranMasukan as string) ?? ''}
          onChange={setField}
        />
      </div>

      {submitError && (
        <p className="form-error" style={{ marginTop: 24 }}>
          <AlertTriangle size={16} />
          {submitError}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={prevStep} disabled={isSubmitting}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button type="submit" className="btn btn-primary" disabled={!complete || isSubmitting}>
          {isSubmitting ? 'Mengirim…' : 'Kirim Data Tracer Study'}
          <Send size={16} />
        </button>
      </div>
    </form>
  );
};

export default Step3Evaluasi;
