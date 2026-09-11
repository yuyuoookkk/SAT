import type React from 'react';
import { ArrowRight, CalendarDays, GraduationCap, Info, Mail, MapPin, Phone, User, Users } from 'lucide-react';
import { ChoiceGroup, SelectField, TextField, TextareaField } from './fields';
import type { FormData } from '../../lib/tracerStudy';
import { JENIS_KELAMIN, JURUSAN, STATUS_KEGIATAN, TAHUN_LULUS } from '../../lib/tracerStudy';

interface Props {
  formData: FormData;
  setField: (name: string, value: string | number) => void;
  nextStep: () => void;
}

/** Step 1 — Figma node 3433:2 ("Data Responden Tracer Study"). */
const Step1Identitas: React.FC<Props> = ({ formData, setField, nextStep }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const str = (k: string) => (formData[k] as string) ?? '';

  return (
    <form className="animate-fade-in" onSubmit={handleSubmit}>
      <div className="form-grid">
        <TextField
          label="Nama Lengkap (Sesuai Ijazah)"
          name="namaLengkap"
          icon={User}
          placeholder="Contoh: I Putu Gede Prasetya"
          value={str('namaLengkap')}
          onChange={setField}
          required
          wide
        />

        <TextField
          label="NISN"
          name="nisn"
          icon={Info}
          placeholder="10 digit nomor NISN"
          value={str('nisn')}
          onChange={setField}
          required
        />

        <SelectField
          label="Jenis Kelamin"
          name="jenisKelamin"
          icon={Users}
          placeholder="Pilih Jenis Kelamin"
          options={[...JENIS_KELAMIN]}
          value={str('jenisKelamin')}
          onChange={setField}
          required
        />

        <SelectField
          label="Tahun Lulus"
          name="tahunLulus"
          icon={CalendarDays}
          placeholder="Pilih Tahun Lulus"
          options={TAHUN_LULUS}
          value={str('tahunLulus')}
          onChange={setField}
          required
        />

        <SelectField
          label="Kompetensi Keahlian (Jurusan)"
          name="jurusan"
          icon={GraduationCap}
          placeholder="Pilih Jurusan"
          options={[...JURUSAN]}
          value={str('jurusan')}
          onChange={setField}
          required
        />

        <TextField
          label="Email Aktif"
          name="email"
          type="email"
          icon={Mail}
          placeholder="nama@email.com"
          value={str('email')}
          onChange={setField}
          required
        />

        <TextField
          label="Nomor HP (WhatsApp)"
          name="noTelepon"
          type="tel"
          icon={Phone}
          placeholder="0812xxxxxxx"
          value={str('noTelepon')}
          onChange={setField}
          required
        />

        <TextareaField
          label="Alamat Domisili Saat Ini"
          name="alamat"
          icon={MapPin}
          rows={3}
          placeholder="Jl. Raya Kampus Unud, Jimbaran, Kec. Kuta Sel., Kabupaten Badung, Bali"
          value={str('alamat')}
          onChange={setField}
        />

        <ChoiceGroup
          label="Status Kegiatan Saat Ini"
          name="statusSaatIni"
          options={[...STATUS_KEGIATAN]}
          value={str('statusSaatIni')}
          onChange={setField}
        />
      </div>

      <div className="form-actions">
        <span className="field-hint" style={{ border: 'none', padding: 0 }}>
          <Info size={14} />
          Verifikasi keakuratan data sebelum melanjutkan kuesioner.
        </span>
        <button type="submit" className="btn btn-primary" disabled={!str('statusSaatIni')}>
          Lanjut ke Status Pekerjaan
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
};

export default Step1Identitas;
