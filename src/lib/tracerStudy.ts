/**
 * Field vocabulary for the Tracer Study wizard.
 *
 * Labels, placeholders and option copy are transcribed from the Figma library
 * "ini Ridho's team library" (file AOfdJghS1yl0lGMHAuwNVs):
 *   - step 1 identity            → node 3433:2
 *   - "form bekerja"             → node 3408:50
 *   - "form kuliah"              → node 3480:112
 *   - "form berwirausaha"        → node 3477:583
 *   - "form Belum Bekerja"       → node 3481:1051
 *   - combined variants          → nodes 3505:2, 3506:1098
 */

export type FormData = Record<string, string | number | undefined>;

export const JENIS_KELAMIN = ['Laki-laki', 'Perempuan'] as const;

export const JURUSAN = [
  'Rekayasa Perangkat Lunak (RPL)',
  'Teknik Komputer dan Jaringan (TKJ)',
  'Multimedia (MM)',
  'Desain Komunikasi Visual (DKV)',
] as const;

const CURRENT_YEAR = new Date().getFullYear();
export const TAHUN_LULUS = Array.from({ length: 16 }, (_, i) => String(CURRENT_YEAR - i));

/** Step 1 radio group — Figma nodes 3435:322 … 3440:22. */
export const STATUS_KEGIATAN = [
  'Bekerja',
  'Melanjutkan Pendidikan',
  'Bekerja Sambil Kuliah',
  'Wiraswasta',
  'Belum Bekerja',
  'Kuliah Sambil Berwirausaha',
] as const;

export type StatusKegiatan = (typeof STATUS_KEGIATAN)[number];

/** Which step-2 sections each status shows. */
export const STATUS_SECTIONS: Record<StatusKegiatan, SectionKey[]> = {
  Bekerja: ['work'],
  'Melanjutkan Pendidikan': ['study'],
  'Bekerja Sambil Kuliah': ['work', 'study'],
  Wiraswasta: ['business'],
  'Belum Bekerja': ['unemployed'],
  'Kuliah Sambil Berwirausaha': ['study', 'business'],
};

export type SectionKey = 'work' | 'study' | 'business' | 'unemployed';

export interface FieldSpec {
  kind: 'text' | 'select' | 'date' | 'number';
  name: string;
  label: string;
  placeholder?: string;
  options?: string[];
  icon?: string;
  wide?: boolean;
}

export interface ScaleSpec {
  name: string;
  label: string;
  lowLabel?: string;
  highLabel?: string;
  caption?: string;
}

export interface ChoiceSpec {
  name: string;
  label: string;
  options: string[];
}

export interface SectionSpec {
  title: string;
  fields: FieldSpec[];
  choice?: ChoiceSpec;
  scales: ScaleSpec[];
}

const SESUAI = { lowLabel: 'Tidak sesuai', highLabel: 'Sangat sesuai' };

export const SECTIONS: Record<SectionKey, SectionSpec> = {
  work: {
    title: 'Informasi Karir & Pekerjaan',
    fields: [
      {
        kind: 'text',
        name: 'namaPerusahaan',
        label: 'Nama Perusahaan / Instansi',
        placeholder: 'Contoh: PT Teknologi Bangsa',
        icon: 'building',
      },
      {
        kind: 'select',
        name: 'bidangPerusahaan',
        label: 'Bidang Perusahaan',
        placeholder: 'Pilih Bidang',
        options: [
          'Teknologi Informasi',
          'Pariwisata & Perhotelan',
          'Manufaktur',
          'Perdagangan & Retail',
          'Keuangan & Perbankan',
          'Pendidikan',
          'Pemerintahan',
          'Lainnya',
        ],
        icon: 'layers',
      },
      {
        kind: 'text',
        name: 'jabatan',
        label: 'Jabatan / Posisi',
        placeholder: 'Contoh: Senior Fullstack Developer',
        icon: 'briefcase',
      },
      { kind: 'date', name: 'tanggalMulaiKerja', label: 'Tanggal Mulai Bekerja', icon: 'calendar' },
      {
        kind: 'select',
        name: 'rentangGaji',
        label: 'Rentang Gaji Bulanan',
        placeholder: 'Pilih Rentang Gaji',
        options: [
          '< Rp3 Juta',
          'Rp3 - 5 Juta',
          'Rp5 - 10 Juta',
          'Rp10 - 20 Juta',
          '> Rp20 Juta',
        ],
        icon: 'wallet',
      },
      {
        kind: 'text',
        name: 'kotaKerja',
        label: 'Kota Tempat Bekerja',
        placeholder: 'Contoh: Denpasar, Bali',
        icon: 'pin',
      },
    ],
    choice: {
      name: 'caraMemperolehPekerjaan',
      label: 'Cara Memperoleh Pekerjaan',
      options: [
        'Bursa Kerja Sekolah',
        'LinkedIn / Media Sosial',
        'Rekomendasi Relasi',
        'Portal Lowongan Kerja',
        'Magang / PKL',
        'Melamar Sendiri',
      ],
    },
    scales: [
      { name: 'kesesuaianJurusan', label: 'Kesesuaian dengan Jurusan', ...SESUAI },
      {
        name: 'kepuasanKerja',
        label: 'Tingkat Kepuasan Bekerja Sekarang',
        caption: 'Puas dengan kondisi saat ini',
      },
    ],
  },

  study: {
    title: 'Informasi Pendidikan / Perguruan Tinggi',
    fields: [
      {
        kind: 'text',
        name: 'namaKampus',
        label: 'Nama Perguruan Tinggi/Kampus',
        placeholder: 'Contoh: Nama kampus',
        icon: 'building',
      },
      {
        kind: 'text',
        name: 'jurusanKuliah',
        label: 'Program Studi/Jurusan',
        placeholder: 'Contoh: Teknik Informatika',
        icon: 'book',
      },
      {
        kind: 'select',
        name: 'jenjangPendidikan',
        label: 'Jenjang Pendidikan',
        placeholder: 'Contoh: D3, D4, S1, atau S2',
        options: ['D1', 'D2', 'D3', 'D4', 'S1', 'S2'],
        icon: 'cap',
      },
      {
        kind: 'select',
        name: 'statusPerguruanTinggi',
        label: 'Jenis / Status Perguruan Tinggi',
        placeholder: 'Contoh: PTN/Negeri',
        options: ['PTN / Negeri', 'PTS / Swasta', 'Kedinasan', 'Luar Negeri'],
        icon: 'layers',
      },
      {
        kind: 'select',
        name: 'sumberPembiayaan',
        label: 'Sumber Pembiayaan Studi',
        placeholder: 'Pilih Sumber Pembiayaan',
        options: ['Biaya Sendiri / Orang Tua', 'Beasiswa Penuh', 'Beasiswa Parsial', 'Ikatan Dinas'],
        icon: 'wallet',
      },
      { kind: 'date', name: 'tahunMasukKuliah', label: 'Tahun Masuk / Tanggal Mulai', icon: 'calendar' },
    ],
    scales: [
      { name: 'kesesuaianJurusanKuliah', label: 'Kesesuaian dengan Jurusan', ...SESUAI },
      {
        name: 'kepuasanKuliah',
        label: 'Tingkat Kepuasan Kuliah Sekarang',
        caption: 'Puas dengan kondisi saat ini',
      },
    ],
  },

  business: {
    title: 'Informasi Usaha / Bisnis',
    fields: [
      {
        kind: 'text',
        name: 'namaUsaha',
        label: 'Nama Usaha / Brand',
        placeholder: 'Contoh: PT Teknologi Bangsa',
        icon: 'building',
      },
      {
        kind: 'text',
        name: 'bidangUsaha',
        label: 'Bidang Usaha',
        placeholder: 'Contoh: IT & Digital',
        icon: 'layers',
      },
      {
        kind: 'select',
        name: 'legalitasUsaha',
        label: 'Status / Legalitas Usaha',
        placeholder: 'Pilih Status Usaha',
        options: ['Perorangan (belum berbadan hukum)', 'CV', 'PT', 'Koperasi', 'UMKM Terdaftar'],
        icon: 'briefcase',
      },
      { kind: 'date', name: 'mulaiUsaha', label: 'Mulai Berdiri / Mulai Usaha', icon: 'calendar' },
      {
        kind: 'text',
        name: 'kotaUsaha',
        label: 'Kota Lokasi Usaha',
        placeholder: 'Contoh: Denpasar, Bali',
        icon: 'pin',
      },
      {
        kind: 'text',
        name: 'omsetBulanan',
        label: 'Omset / Income Bulanan',
        placeholder: 'Contoh: Rp3-5 Juta',
        icon: 'wallet',
      },
      {
        kind: 'number',
        name: 'jumlahKaryawan',
        label: 'Jumlah Karyawan / Tenaga Kerja',
        placeholder: 'Contoh: 2',
        icon: 'users',
      },
      {
        kind: 'select',
        name: 'sumberModal',
        label: 'Sumber Modal Usaha',
        placeholder: 'Pilih Sumber Modal',
        options: ['Modal Sendiri', 'Pinjaman Keluarga', 'Pinjaman Bank', 'Investor', 'Hibah / Program'],
        icon: 'wallet',
      },
    ],
    scales: [
      { name: 'kesesuaianJurusanUsaha', label: 'Kesesuaian dengan Jurusan', ...SESUAI },
      {
        name: 'perkembanganUsaha',
        label: 'Tingkat Perkembangan Usaha',
        caption: 'Puas dengan kondisi saat ini',
      },
    ],
  },

  unemployed: {
    title: 'Informasi Belum Bekerja / Sedang Mencari Kerja',
    fields: [
      {
        kind: 'text',
        name: 'kegiatanSaatIni',
        label: 'Status Kegiatan Saat Ini',
        placeholder: 'Contoh: Mencari Pekerjaan',
        icon: 'briefcase',
      },
      {
        kind: 'text',
        name: 'lamaMenunggu',
        label: 'Lama Menunggu / Belum Bekerja',
        placeholder: 'Contoh: 6 Bulan',
        icon: 'calendar',
      },
      {
        kind: 'text',
        name: 'channelMelamar',
        label: 'Channel Melamar Kerja yang Digunakan',
        placeholder: 'Contoh: Melamar Mandiri',
        icon: 'layers',
      },
      {
        kind: 'text',
        name: 'jumlahLamaran',
        label: 'Perkiraan Jumlah Lamaran Dikirim',
        placeholder: 'Contoh: 5 Perusahaan',
        icon: 'info',
      },
      {
        kind: 'text',
        name: 'kendalaUtama',
        label: 'Kendala Utama yang Dihadapi',
        placeholder: 'Contoh: Terbatasnya lowongan sesuai jurusan',
        icon: 'info',
        wide: true,
      },
      {
        kind: 'select',
        name: 'kebutuhanProgram',
        label: 'Kebutuhan Program',
        placeholder: 'Pilih Program',
        options: [
          'Pelatihan Kerja / Upskilling',
          'Sertifikasi Kompetensi',
          'Job Fair / Bursa Kerja',
          'Pendampingan Wirausaha',
          'Informasi Beasiswa',
        ],
        icon: 'cap',
        wide: true,
      },
    ],
    scales: [],
  },
};

/** Step 3 evaluation rows — Figma node 3442:410, ordered top to bottom. */
export const EVALUATION_ROWS = [
  { name: 'ratingGuru', label: 'Kualitas Guru & Pengajaran' },
  { name: 'ratingFasilitas', label: 'Fasilitas Sekolah & Laboratorium' },
  { name: 'ratingKurikulum', label: 'Pembelajaran Produktif (Kejuruan)' },
  { name: 'ratingPkl', label: 'Program PKL / Prakerin' },
  { name: 'ratingSkill', label: 'Pengembangan Soft Skill & Hard Skill' },
  { name: 'ratingDisiplin', label: 'Kedisiplinan & Lingkungan Sekolah' },
] as const;
