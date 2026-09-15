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

/** Step 3 — Figma node 3442:410 ("Evaluasi Kualitas Pendidikan"). */
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
