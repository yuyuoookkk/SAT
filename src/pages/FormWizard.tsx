import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Step1Identitas from '../components/form/Step1Identitas';
import Step2Status from '../components/form/Step2Status';
import Step3Evaluasi from '../components/form/Step3Evaluasi';
import Step4Selesai from '../components/form/Step4Selesai';
import { supabase } from '../lib/supabase';

const FormWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextStep = () => {
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const submitToSupabase = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase
        .from('tracer_study')
        .insert([
          {
            nama_lengkap: formData.namaLengkap,
            nisn: formData.nisn,
            tahun_lulus: parseInt(formData.tahunLulus),
            no_telepon: formData.noTelepon,
            status_saat_ini: formData.statusSaatIni,
            nama_perusahaan: formData.namaPerusahaan || null,
            jabatan: formData.jabatan || null,
            kesesuaian_jurusan: formData.kesesuaianJurusan || null,
            nama_kampus: formData.namaKampus || null,
            jurusan_kuliah: formData.jurusanKuliah || null,
            nama_usaha: formData.namaUsaha || null,
            bidang_usaha: formData.bidangUsaha || null,
            kegiatan_saat_ini: formData.kegiatanSaatIni || null,
            rating_fasilitas: formData.ratingFasilitas,
            rating_kurikulum: formData.ratingKurikulum,
            saran_masukan: formData.saranMasukan || null,
          }
        ]);

      if (error) throw error;

      nextStep();
    } catch (err: any) {
      console.error('Supabase insert error:', err);
      setSubmitError(err.message || 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Identitas formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        return <Step2Status formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 3:
        return (
          <Step3Evaluasi
            formData={formData}
            setFormData={setFormData}
            onSubmit={submitToSupabase}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        );
      case 4:
        return <Step4Selesai />;
      default:
        return <Step1Identitas formData={formData} setFormData={setFormData} nextStep={nextStep} />;
    }
  };

  const renderProgress = () => {
    if (step === 4) return null; // Hide on success page

    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Langkah {step} dari 3</span>
          <span>{Math.round((step / 3) * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${(step / 3) * 100}%`, 
            height: '100%', 
            backgroundColor: 'var(--primary-color)',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="main-content container" style={{ paddingTop: '1.5rem' }}>
        <div className="card">
          {renderProgress()}
          {renderStep()}
        </div>
      </main>
    </>
  );
};

export default FormWizard;
