import React from 'react';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
}

const statusOptions = [
  { id: 'bekerja', label: 'Bekerja' },
  { id: 'kuliah', label: 'Kuliah' },
  { id: 'wirausaha', label: 'Wirausaha' },
  { id: 'belum_bekerja', label: 'Belum Bekerja / Mencari Kerja' },
  { id: 'bekerja_kuliah', label: 'Bekerja Sambil Kuliah' },
  { id: 'kuliah_wirausaha', label: 'Kuliah Sambil Berwirausaha' }
];

const Step2Status: React.FC<Props> = ({ formData, setFormData, nextStep }) => {
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, statusSaatIni: e.target.value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const renderConditionalFields = () => {
    const status = formData.statusSaatIni;
    if (!status) return null;

    if (status.includes('bekerja')) {
      return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Informasi Pekerjaan</h3>
          <div className="form-group">
            <label className="form-label">Nama Perusahaan / Tempat Kerja</label>
            <input type="text" name="namaPerusahaan" className="form-control" value={formData.namaPerusahaan || ''} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Jabatan / Posisi</label>
            <input type="text" name="jabatan" className="form-control" value={formData.jabatan || ''} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Kesesuaian dengan Jurusan</label>
            <select name="kesesuaianJurusan" className="form-control" value={formData.kesesuaianJurusan || ''} onChange={handleInputChange} required>
              <option value="">-- Pilih --</option>
              <option value="sangat_sesuai">Sangat Sesuai</option>
              <option value="sesuai">Sesuai</option>
              <option value="kurang_sesuai">Kurang Sesuai</option>
              <option value="tidak_sesuai">Tidak Sesuai</option>
            </select>
          </div>
        </div>
      );
    }
    
    if (status.includes('kuliah')) {
      return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Informasi Perguruan Tinggi</h3>
          <div className="form-group">
            <label className="form-label">Nama Kampus / Universitas</label>
            <input type="text" name="namaKampus" className="form-control" value={formData.namaKampus || ''} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Jurusan / Program Studi</label>
            <input type="text" name="jurusanKuliah" className="form-control" value={formData.jurusanKuliah || ''} onChange={handleInputChange} required />
          </div>
        </div>
      );
    }

    if (status.includes('wirausaha')) {
      return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Informasi Usaha</h3>
          <div className="form-group">
            <label className="form-label">Nama Usaha</label>
            <input type="text" name="namaUsaha" className="form-control" value={formData.namaUsaha || ''} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Bidang Usaha</label>
            <input type="text" name="bidangUsaha" className="form-control" value={formData.bidangUsaha || ''} onChange={handleInputChange} required />
          </div>
        </div>
      );
    }

    if (status === 'belum_bekerja') {
      return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Kegiatan Saat Ini</label>
            <input type="text" name="kegiatanSaatIni" className="form-control" placeholder="Contoh: Mengikuti kursus, persiapan kuliah" value={formData.kegiatanSaatIni || ''} onChange={handleInputChange} required />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Status Alumni</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pilih aktivitas Anda saat ini.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Status Saat Ini</label>
          <select 
            className="form-control" 
            name="statusSaatIni"
            value={formData.statusSaatIni || ''}
            onChange={handleStatusChange}
            required
          >
            <option value="">-- Pilih Status --</option>
            {statusOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        {renderConditionalFields()}

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={!formData.statusSaatIni}>Selanjutnya</button>
        </div>
      </form>
    </div>
  );
};

export default Step2Status;
