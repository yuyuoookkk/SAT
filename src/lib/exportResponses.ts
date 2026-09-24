import { fetchAllResponses } from './adminData';
import { STATUS_LABEL } from './adminData';

/* =============================================================================
 * Export every questionnaire response to Excel.
 *
 * "Every" is the point: not the page on screen, and not just what the current
 * filters allow. An admin exporting for accreditation needs the whole cohort,
 * and a spreadsheet that silently contained only the visible eight rows would
 * be worse than no export at all.
 *
 * PostgREST caps a response at 1000 rows, so fetchAllResponses pages through
 * in batches and reports progress while it goes — on a large cohort the button
 * would otherwise look frozen.
 *
 * The 51 columns below mirror the questionnaire. Identifiers are written as
 * TEXT rather than numbers, because Excel helpfully turns the NISN 0071234567
 * into 71234567 and the school's records stop matching.
 *
 * write-excel-file is imported lazily, inside the function: it is only needed
 * by an admin who clicks Export, so it should not be in the bundle every
 * alumnus downloads.
 * ========================================================================== */

/** A column in the exported workbook. */
interface Col {
  header: string;
  key: string;
  /** Identifiers must stay text or Excel eats the leading zero. */
  text?: boolean;
  width?: number;
}

const COLUMNS: Col[] = [
  // Identitas
  { header: 'NISN', key: 'nisn', text: true, width: 14 },
  { header: 'NIK', key: 'nik', text: true, width: 20 },
  { header: 'Nama Lengkap', key: 'nama_lengkap', width: 26 },
  { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 14 },
  { header: 'Jurusan', key: 'jurusan', width: 28 },
  { header: 'Angkatan', key: 'tahun_lulus', width: 10 },
  { header: 'Email', key: 'email', width: 28 },
  { header: 'Nomor HP', key: 'no_telepon', text: true, width: 16 },
  { header: 'Alamat', key: 'alamat', width: 34 },
  { header: 'Status Saat Ini', key: '_status', width: 20 },
  { header: 'Waktu Pengisian', key: '_waktu', width: 20 },

  // Karir & pekerjaan
  { header: 'Nama Perusahaan', key: 'nama_perusahaan', width: 26 },
  { header: 'Bidang Perusahaan', key: 'bidang_perusahaan', width: 22 },
  { header: 'Jabatan', key: 'jabatan', width: 24 },
  { header: 'Tanggal Mulai Bekerja', key: 'tanggal_mulai_kerja', width: 18 },
  { header: 'Rentang Gaji', key: 'rentang_gaji', width: 16 },
  { header: 'Kota Tempat Bekerja', key: 'kota_kerja', width: 18 },
  { header: 'Cara Memperoleh Pekerjaan', key: 'cara_memperoleh_pekerjaan', width: 24 },
  { header: 'Kepuasan Bekerja (1-5)', key: 'kepuasan_kerja', width: 18 },

  // Pendidikan lanjut
  { header: 'Nama Perguruan Tinggi', key: 'nama_kampus', width: 26 },
  { header: 'Program Studi', key: 'jurusan_kuliah', width: 24 },
  { header: 'Jenjang Pendidikan', key: 'jenjang_pendidikan', width: 16 },
  { header: 'Status Perguruan Tinggi', key: 'status_perguruan_tinggi', width: 18 },
  { header: 'Sumber Pembiayaan', key: 'sumber_pembiayaan', width: 20 },
  { header: 'Tahun Masuk Kuliah', key: 'tahun_masuk_kuliah', width: 16 },
  { header: 'Kesesuaian Kuliah (1-5)', key: 'kesesuaian_jurusan_kuliah', width: 18 },
  { header: 'Kepuasan Kuliah (1-5)', key: 'kepuasan_kuliah', width: 18 },

  // Wirausaha
  { header: 'Nama Usaha', key: 'nama_usaha', width: 24 },
  { header: 'Bidang Usaha', key: 'bidang_usaha', width: 20 },
  { header: 'Legalitas Usaha', key: 'legalitas_usaha', width: 20 },
  { header: 'Mulai Usaha', key: 'mulai_usaha', width: 14 },
  { header: 'Kota Usaha', key: 'kota_usaha', width: 16 },
  { header: 'Omset Bulanan', key: 'omset_bulanan', width: 16 },
  { header: 'Jumlah Karyawan', key: 'jumlah_karyawan', width: 14 },
  { header: 'Sumber Modal', key: 'sumber_modal', width: 20 },
  { header: 'Kesesuaian Usaha (1-5)', key: 'kesesuaian_jurusan_usaha', width: 18 },
  { header: 'Perkembangan Usaha (1-5)', key: 'perkembangan_usaha', width: 18 },

  // Belum bekerja
  { header: 'Kegiatan Saat Ini', key: 'kegiatan_saat_ini', width: 22 },
  { header: 'Lama Menunggu', key: 'lama_menunggu', width: 16 },
  { header: 'Channel Melamar', key: 'channel_melamar', width: 20 },
  { header: 'Jumlah Lamaran', key: 'jumlah_lamaran', width: 16 },
  { header: 'Kendala Utama', key: 'kendala_utama', width: 26 },
  { header: 'Kebutuhan Program', key: 'kebutuhan_program', width: 24 },

  // Evaluasi
  { header: 'Kualitas Guru (1-5)', key: 'rating_guru', width: 16 },
  { header: 'Fasilitas (1-5)', key: 'rating_fasilitas', width: 14 },
  { header: 'Pembelajaran Produktif (1-5)', key: 'rating_kurikulum', width: 20 },
  { header: 'Program PKL (1-5)', key: 'rating_pkl', width: 16 },
  { header: 'Soft & Hard Skill (1-5)', key: 'rating_skill', width: 18 },
  { header: 'Kedisiplinan (1-5)', key: 'rating_disiplin', width: 16 },
  { header: 'Link & Match (1-5)', key: 'kesesuaian_jurusan_skor', width: 16 },
  { header: 'Saran & Masukan', key: 'saran_masukan', width: 44 },
];

const asDate = (v: unknown): string => {
  if (!v) return '';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? String(v)
    : new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Asia/Makassar',
      }).format(d);
};

/**
 * Download every questionnaire response as a real .xlsx.
 *
 * Not CSV: Excel reads a bare NISN like "0058291823" as a number and drops the
 * leading zero, quietly corrupting the school's identifiers. Writing a real
 * workbook lets those columns be typed as text.
 *
 * The writer is imported lazily so it only reaches the browser when an admin
 * actually exports, rather than loading on every page.
 */
export async function downloadAllResponses(
  onProgress?: (loaded: number, total: number) => void,
): Promise<number> {
  const rows = await fetchAllResponses(onProgress);

  const header = COLUMNS.map((c) => ({
    value: c.header,
    fontWeight: 'bold' as const,
  }));

  const body = rows.map((row) =>
    COLUMNS.map((c) => {
      let raw: unknown;
      if (c.key === '_status') {
        raw = STATUS_LABEL[String(row.status_saat_ini ?? '')] ?? row.status_saat_ini ?? '';
      } else if (c.key === '_waktu') {
        raw = asDate(row.created_at);
      } else {
        raw = row[c.key];
      }

      if (raw === null || raw === undefined || raw === '') return { value: '', type: String };
      if (c.text) return { value: String(raw), type: String };
      if (typeof raw === 'number') return { value: raw, type: Number };
      return { value: String(raw), type: String };
    }),
  );

  const writeXlsxFile = (await import('write-excel-file/browser')).default;
  await writeXlsxFile([header, ...body], {
    sheet: 'Hasil Kuisioner',
    columns: COLUMNS.map((c) => ({ width: c.width ?? 18 })),
    stickyRowsCount: 1,
  }).toFile(`hasil-kuisioner-tracer-study-${new Date().toISOString().slice(0, 10)}.xlsx`);

  return rows.length;
}
