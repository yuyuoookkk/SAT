import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import StepIndicator from '../components/ui/StepIndicator';
import Step1Identitas from '../components/form/Step1Identitas';
import Step2Status from '../components/form/Step2Status';
import Step3Evaluasi from '../components/form/Step3Evaluasi';
import Step4Selesai from '../components/form/Step4Selesai';
import FormAside from '../components/form/FormAside';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../lib/adminAuthContext';
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
  Kuliah: 'kuliah',
  'Bekerja Sambil Kuliah': 'bekerja_kuliah',
  Wirausaha: 'wirausaha',
  'Kuliah Sambil Berwirausaha': 'kuliah_wirausaha',
  'Belum Bekerja': 'belum_bekerja',
};

const FormWizard = () => {
  // Reaching this page means a session exists (RequireAuth, plus migration 0007
  // at the database end). It attributes the response and prefills the email.
  const { session } = useAdminAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (name: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  // Prefill the signed-in alumnus's email, as a convenience only. Derived at
  // render rather than written into state, so typing over it simply wins and no
  // effect races the first paint.
  //
  // The test is `=== undefined`, not falsiness: `setField` writes '' when the
  // field is cleared, and treating that as "not filled in yet" made the account
  // email snap straight back, so an alumnus signed in on a shared or school
  // account could never enter their own address.
  const sessionEmail = session?.user?.email;
  const data: FormData =
    sessionEmail && formData.email === undefined
      ? { ...formData, email: sessionEmail }
      : formData;

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => goTo(step + 1);
  const prevStep = () => goTo(step - 1);

  const submitToSupabase = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Trim on the way out: a trailing space in a NISN or an email is invisible
    // in the UI but makes the row impossible to match later.
    const str = (k: string) => {
      const v = data[k];
      if (typeof v !== 'string') return v ?? null;
      const t = v.trim();
      return t === '' ? null : t;
    };
    const num = (k: string) => (data[k] as number) ?? null;
    const int = (k: string) => {
      const v = data[k];
      if (v === undefined || v === '') return null;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? null : n;
    };
    const statusLabel = (data.statusSaatIni as string) ?? '';

    // One Link & Match score, whichever section the chosen status showed.
    const kesesuaian =
      num('kesesuaianJurusan') ?? num('kesesuaianJurusanKuliah') ?? num('kesesuaianJurusanUsaha');

    try {
      // Deliberately no `.select()` here: anon may INSERT but not SELECT, and
      // chaining .select() would request RETURNING and be refused by RLS.
      const { error } = await supabase.from('tracer_study').insert([
        {
          // identitas
          nama_lengkap: str('namaLengkap'),
          nisn: str('nisn'),
          jenis_kelamin: str('jenisKelamin'),
          jurusan: str('jurusan'),
          tahun_lulus: int('tahunLulus'),
          email: str('email'),
          no_telepon: str('noTelepon'),
          alamat: str('alamat'),
          status_saat_ini: STATUS_DB_VALUE[statusLabel] ?? statusLabel,
          // Null for an anonymous visitor; the RLS policy added in migration
          // 0005 only permits a user to file a response as themselves.
          user_id: session?.user?.id ?? null,

          // karir & pekerjaan
          nama_perusahaan: str('namaPerusahaan'),
          bidang_perusahaan: str('bidangPerusahaan'),
          jabatan: str('jabatan'),
          tanggal_mulai_kerja: str('tanggalMulaiKerja'),
          rentang_gaji: str('rentangGaji'),
          kota_kerja: str('kotaKerja'),
          cara_memperoleh_pekerjaan: str('caraMemperolehPekerjaan'),
          kepuasan_kerja: num('kepuasanKerja'),

          // pendidikan lanjut
          nama_kampus: str('namaKampus'),
          jurusan_kuliah: str('jurusanKuliah'),
          jenjang_pendidikan: str('jenjangPendidikan'),
          status_perguruan_tinggi: str('statusPerguruanTinggi'),
          sumber_pembiayaan: str('sumberPembiayaan'),
          tahun_masuk_kuliah: str('tahunMasukKuliah'),
          kesesuaian_jurusan_kuliah: num('kesesuaianJurusanKuliah'),
          kepuasan_kuliah: num('kepuasanKuliah'),

          // wirausaha
          nama_usaha: str('namaUsaha'),
          bidang_usaha: str('bidangUsaha'),
          legalitas_usaha: str('legalitasUsaha'),
          mulai_usaha: str('mulaiUsaha'),
          kota_usaha: str('kotaUsaha'),
          omset_bulanan: str('omsetBulanan'),
          jumlah_karyawan: int('jumlahKaryawan'),
          sumber_modal: str('sumberModal'),
          kesesuaian_jurusan_usaha: num('kesesuaianJurusanUsaha'),
          perkembangan_usaha: num('perkembanganUsaha'),

          // belum bekerja
          kegiatan_saat_ini: str('kegiatanSaatIni'),
          lama_menunggu: str('lamaMenunggu'),
          channel_melamar: str('channelMelamar'),
          jumlah_lamaran: str('jumlahLamaran'),
          kendala_utama: str('kendalaUtama'),
          kebutuhan_program: str('kebutuhanProgram'),

          // evaluasi
          rating_guru: num('ratingGuru'),
          rating_fasilitas: num('ratingFasilitas'),
          rating_kurikulum: num('ratingKurikulum'),
          rating_pkl: num('ratingPkl'),
          rating_skill: num('ratingSkill'),
          rating_disiplin: num('ratingDisiplin'),
          saran_masukan: str('saranMasukan'),

          // Link & Match: the pre-existing text column keeps its shape, and the
          // numeric twin added in migration 0001 is what the dashboard reads.
          kesesuaian_jurusan: kesesuaian !== null ? String(kesesuaian) : null,
          kesesuaian_jurusan_skor: kesesuaian,
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
        <div className="container">
          <StepIndicator current={step} />

          <div className={`form-layout${step === 1 ? ' form-layout--single' : ''}`}>
            <div className="form-panel">
              {step === 1 && (
                <div className="form-panel__band">
                  <h2>{band.title}</h2>
                  <p>{band.lede}</p>
                </div>
              )}
              {step === 1 && (
                <Step1Identitas formData={data} setField={setField} nextStep={nextStep} />
              )}
              {step === 2 && (
                <Step2Status
                  formData={data}
                  setField={setField}
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              )}
              {step === 3 && (
                <Step3Evaluasi
                  formData={data}
                  setField={setField}
                  prevStep={prevStep}
                  onSubmit={submitToSupabase}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              )}
            </div>

            {step !== 1 && (step === 3 ? (
              <FormAside
                title="Pentingnya Evaluasi"
                paragraphs={[
                  'Penilaian Anda sangat berharga untuk proses akreditasi sekolah dan penjaminan mutu pendidikan.',
                  'Hasil evaluasi ini akan digunakan sebagai bahan pertimbangan dalam memperbarui kurikulum agar tetap relevan dengan kebutuhan industri saat ini.',
                ]}
                bullets={['Peningkatan mutu lulusan', 'Update kurikulum industri']}
              />
            ) : (
              <FormAside
                title="Mengapa data ini penting?"
                paragraphs={[
                  'Data pekerjaan Anda membantu SMK TI Bali Global Jimbaran mengevaluasi efektivitas kurikulum yang diajarkan.',
                  'Informasi ini menjadi basis data untuk akreditasi sekolah dan membantu kami membangun kemitraan industri yang lebih kuat bagi adik-adik kelas Anda.',
                ]}
                bullets={[
                  'Pemetaan industri alumni',
                  'Peningkatan sarana Lab IT',
                  'Program Alumni Career Talk',
                ]}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default FormWizard;
