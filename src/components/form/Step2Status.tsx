import type React from 'react';
import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  Info,
  Layers,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react';
import { ChoiceGroup, EmojiScale, Scale, SelectField, TextField } from './fields';
import type { FieldSpec, FormData, StatusKegiatan } from '../../lib/tracerStudy';
import { SECTIONS, STATUS_SECTIONS } from '../../lib/tracerStudy';

const ICONS: Record<string, ComponentType<{ size?: number | string }>> = {
  building: Building2,
  briefcase: Briefcase,
  calendar: CalendarDays,
  wallet: Wallet,
  pin: MapPin,
  layers: Layers,
  book: BookOpen,
  cap: GraduationCap,
  users: Users,
  info: Info,
};

interface Props {
  formData: FormData;
  setField: (name: string, value: string | number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

/**
 * Step 2 — the status-dependent detail form.
 *
 * The Figma has one artboard per status ("form bekerja", "form kuliah",
 * "form berwirausaha", "form Belum Bekerja" and the two combined variants).
 * They share a single card layout, so this renders the sections that the
 * chosen status maps to rather than duplicating six near-identical screens.
 */
const Step2Status: React.FC<Props> = ({ formData, setField, nextStep, prevStep }) => {
  const status = formData.statusSaatIni as StatusKegiatan | undefined;
  const sections = status ? STATUS_SECTIONS[status] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  // A date describing something that already happened cannot be in the future.
  const today = new Date().toISOString().slice(0, 10);

  const renderField = (spec: FieldSpec) => {
    const Icon = spec.icon ? ICONS[spec.icon] : undefined;
    const value = (formData[spec.name] as string) ?? '';

    if (spec.kind === 'select') {
      return (
        <SelectField
          key={spec.name}
          label={spec.label}
          name={spec.name}
          icon={Icon}
          wide={spec.wide}
          placeholder={spec.placeholder ?? 'Pilih'}
          options={spec.options ?? []}
          value={value}
          onChange={setField}
          required={spec.required}
        />
      );
    }

    return (
      <TextField
        key={spec.name}
        label={spec.label}
        name={spec.name}
        icon={Icon}
        wide={spec.wide}
        type={spec.kind === 'date' ? 'date' : spec.kind === 'number' ? 'number' : 'text'}
        placeholder={spec.placeholder}
        value={value}
        onChange={setField}
        required={spec.required}
        maxLength={spec.maxLength ?? (spec.kind === 'text' ? 120 : undefined)}
        minLength={spec.minLength}
        numeric={spec.numeric}
        min={spec.min}
        max={spec.max === 'today' ? today : spec.max}
      />
    );
  };

  return (
    <form className="animate-fade-in" onSubmit={handleSubmit}>
      <div className="form-panel__head">
        <h3>{sections.length ? SECTIONS[sections[0]].title : 'Informasi Status'}</h3>
        <p>
          Berikan informasi detail mengenai status profesional Anda saat ini untuk membantu sekolah
          memetakan relevansi kurikulum.
        </p>
      </div>

      {!status && (
        <p className="form-error">
          <Info size={16} />
          Pilih status kegiatan pada langkah sebelumnya terlebih dahulu.
        </p>
      )}

      {sections.map((key, i) => {
        const section = SECTIONS[key];

        return (
          <section className="form-section" key={key}>
            {i > 0 && <h4 className="form-section__title">{section.title}</h4>}

            <div className="form-grid">
              {section.fields.map(renderField)}

              {section.choice && (
                <ChoiceGroup
                  label={section.choice.label}
                  name={section.choice.name}
                  options={section.choice.options}
                  value={(formData[section.choice.name] as string) ?? ''}
                  onChange={setField}
                  columns={3}
                />
              )}

              {/* Alignment is a 1-5 judgement; satisfaction is a feeling, so the
                  design asks for it with faces. */}
              <div className="scale-pair">
                {section.scales.map((scale) =>
                  scale.lowLabel ? (
                    <Scale
                      key={scale.name}
                      label={scale.label}
                      name={scale.name}
                      value={formData[scale.name] as number | undefined}
                      onChange={setField}
                      lowLabel={scale.lowLabel}
                      highLabel={scale.highLabel}
                    />
                  ) : (
                    <EmojiScale
                      key={scale.name}
                      label={scale.label}
                      name={scale.name}
                      value={formData[scale.name] as number | undefined}
                      onChange={setField}
                      caption={scale.caption}
                    />
                  ),
                )}
              </div>
            </div>
          </section>
        );
      })}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={prevStep}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button type="submit" className="btn btn-primary" disabled={!status}>
          Lanjut ke Evaluasi
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
};

export default Step2Status;
