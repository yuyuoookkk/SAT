import { useState } from 'react';
import { Info, LifeBuoy, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import StepIndicator from '../components/ui/StepIndicator';
import Step1Identitas from '../components/form/Step1Identitas';
import Step2Status from '../components/form/Step2Status';
import Step3Evaluasi from '../components/form/Step3Evaluasi';
import Step4Selesai from '../components/form/Step4Selesai';
import { supabase } from '../lib/supabase';
import type { FormData } from '../lib/tracerStudy';

/** Copy for the blue band above the form — Figma node 3435:223. */
const BAND = [
  {
    title: 'Data Responden Tracer Study',
    lede: 'Lengkapi informasi identitas untuk memulai proses tracking penelusuran lulusan.',
  },
  {
    title: 'Informasi Status Alumni',
    lede: 'Berikan informasi detail mengenai status profesional Anda saat ini untuk membantu sekolah memetakan relevansi kurikulum.',
  },
  {
    title: 'Evaluasi Kualitas Pendidikan',
    lede: 'Berikan umpan balik jujur Anda untuk membantu kami meningkatkan kualitas pendidikan dan relevansi kurikulum bagi generasi mendatang.',
  },
];

/**
 * The Figma status labels map back onto the identifiers this project already
 * writes to `tracer_study.status_saat_ini`, so existing rows stay comparable.
 */
const STATUS_DB_VALUE: Record<string, string> = {
  Bekerja: 'bekerja',
  'Melanjutkan Pendidikan': 'kuliah',
  'Bekerja Sambil Kuliah': 'bekerja_kuliah',
  Wiraswasta: 'wirausaha',
  'Belum Bekerja': 'belum_bekerja',
  'Kuliah Sambil Berwirausaha': 'kuliah_wirausaha',
};

const FormWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (name: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => goTo(step + 1);
  const prevStep = () => goTo(step - 1);

  const submitToSupabase = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const str = (k: string) => (formData[k] as string) || null;
    const num = (k: string) => (formData[k] as number) ?? null;
    const statusLabel = (formData.statusSaatIni as string) ?? '';

    try {
      const { error } = await supabase.from('tracer_study').insert([
        {
          nama_lengkap: str('namaLengkap'),
          nisn: str('nisn'),
          tahun_lulus: formData.tahunLulus ? parseInt(String(formData.tahunLulus), 10) : null,
          no_telepon: str('noTelepon'),
          status_saat_ini: STATUS_DB_VALUE[statusLabel] ?? statusLabel,
          nama_perusahaan: str('namaPerusahaan'),
          jabatan: str('jabatan'),
          // Kept as text: this column previously stored string values.
          kesesuaian_jurusan:
            formData.kesesuaianJurusan !== undefined ? String(formData.kesesuaianJurusan) : null,
          nama_kampus: str('namaKampus'),
          jurusan_kuliah: str('jurusanKuliah'),
          nama_usaha: str('namaUsaha'),
          bidang_usaha: str('bidangUsaha'),
          kegiatan_saat_ini: str('kegiatanSaatIni'),
          rating_fasilitas: num('ratingFasilitas'),
          rating_kurikulum: num('ratingKurikulum'),
          saran_masukan: str('saranMasukan'),
        },
      ]);

      if (error) throw error;
      nextStep();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data. Silakan coba lagi.';
      console.error('Supabase insert error:', err);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4) {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
            <Step4Selesai />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const band = BAND[step - 1];

  return (
    <>
      <Header />

      <main className="main-content">
        {step === 1 && (
          <section className="form-band">
            <div className="container form-band__inner">
              <h2>{band.title}</h2>
              <p>{band.lede}</p>
            </div>
          </section>
        )}

        <div className="container">
          <StepIndicator current={step} />

          <div className="form-layout">
            <div className="form-panel">
              {step === 1 && (
                <Step1Identitas formData={formData} setField={setField} nextStep={nextStep} />
              )}
              {step === 2 && (
                <Step2Status
                  formData={formData}
                  setField={setField}
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              )}
              {step === 3 && (
                <Step3Evaluasi
                  formData={formData}
                  setField={setField}
                  prevStep={prevStep}
                  onSubmit={submitToSupabase}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              )}
            </div>

            <aside className="form-aside">
              <div className="info-card info-card--tint">
                <span className="info-card__icon">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <h4>Pentingnya Evaluasi</h4>
                  <p>
                    Penilaian Anda sangat berharga untuk proses akreditasi sekolah dan penjaminan
                    mutu pendidikan.
                  </p>
                  <ul>
                    <li>Dipakai dalam pembaruan kurikulum</li>
                    <li>Menjaga relevansi dengan kebutuhan industri</li>
                  </ul>
                </div>
              </div>

              <div className="info-card">
                <span className="info-card__icon">
                  <LifeBuoy size={24} />
                </span>
                <div>
                  <h4>Butuh Bantuan?</h4>
                  <p>
                    Jika Anda memiliki kendala dalam mengisi form ini, silakan hubungi tim Tracer
                    Study kami.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <a href="mailto:info@smktibaliglobaljimbaran.sch.id">
                      info@smktibaliglobaljimbaran.sch.id
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-card">
                <span className="info-card__icon">
                  <Info size={24} />
                </span>
                <div>
                  <h4>Data Anda Aman</h4>
                  <p>
                    Informasi yang Anda kirimkan hanya digunakan untuk keperluan internal sekolah
                    dan tidak dibagikan kepada pihak ketiga.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default FormWizard;
