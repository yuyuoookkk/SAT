import React from 'react';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
}

const Step1Identitas: React.FC<Props> = ({ formData, setFormData, nextStep }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Data Diri</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Lengkapi identitas pribadi Anda.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nama Lengkap</label>
          <input 
            type="text" 
            name="namaLengkap" 
            className="form-control" 
            placeholder="Contoh: Budi Santoso"
            value={formData.namaLengkap || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">NISN</label>
          <input 
            type="text" 
            name="nisn" 
            className="form-control" 
            placeholder="Contoh: 0041234567"
            value={formData.nisn || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tahun Lulus</label>
          <input 
            type="number" 
            name="tahunLulus" 
            className="form-control" 
            placeholder="Contoh: 2023"
            value={formData.tahunLulus || ''}
            onChange={handleChange}
            required
            min="2000"
            max="2030"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nomor Telepon / WhatsApp</label>
          <input 
            type="tel" 
            name="noTelepon" 
            className="form-control" 
            placeholder="Contoh: 081234567890"
            value={formData.noTelepon || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary">Selanjutnya</button>
        </div>
      </form>
    </div>
  );
};

export default Step1Identitas;
