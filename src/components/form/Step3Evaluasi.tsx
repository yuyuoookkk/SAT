import React from 'react';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const emojis = [
  { value: 1, label: 'Sangat Kurang', emoji: '😞' },
  { value: 2, label: 'Kurang', emoji: '😐' },
  { value: 3, label: 'Cukup', emoji: '🙂' },
  { value: 4, label: 'Baik', emoji: '😊' },
  { value: 5, label: 'Sangat Baik', emoji: '🤩' }
];

const Step3Evaluasi: React.FC<Props> = ({ formData, setFormData, onSubmit, isSubmitting, submitError }) => {
  const handleRatingChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const renderRatingGroup = (label: string, field: string) => (
    <div className="form-group" style={{ marginBottom: '2rem' }}>
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
        {emojis.map((opt) => {
          const isSelected = formData[field] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRatingChange(field, opt.value)}
              style={{
                flex: 1,
                padding: '0.75rem 0',
                background: isSelected ? 'var(--primary-color)' : 'var(--card-bg)',
                color: isSelected ? 'white' : 'var(--text-primary)',
                border: `1px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
              <span style={{ fontSize: '0.7rem', display: 'none' }}>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Evaluasi Sekolah</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Bantu kami meningkatkan kualitas pendidikan.</p>

      <form onSubmit={handleSubmit}>
        
        {renderRatingGroup('Bagaimana penilaian Anda terhadap fasilitas sekolah?', 'ratingFasilitas')}
        {renderRatingGroup('Bagaimana relevansi kurikulum dengan dunia kerja?', 'ratingKurikulum')}
        
        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label className="form-label">Saran dan Masukan (Opsional)</label>
          <textarea 
            name="saranMasukan" 
            className="form-control" 
            rows={4}
            placeholder="Tuliskan saran Anda di sini..."
            value={formData.saranMasukan || ''}
            onChange={handleTextChange}
          ></textarea>
        </div>

        {submitError && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '8px',
            color: '#dc3545',
            fontSize: '0.9rem'
          }}>
            ⚠️ {submitError}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!formData.ratingFasilitas || !formData.ratingKurikulum || isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step3Evaluasi;

