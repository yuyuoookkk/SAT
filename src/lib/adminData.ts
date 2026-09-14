import { supabase } from './supabase';

/* =============================================================================
   Types mirroring supabase/migrations/0001_admin_schema.sql
   ========================================================================== */

export interface DashboardActivity {
  kind: 'submission' | 'import' | 'admin';
  message: string;
  created_at: string;
}

export interface DashboardStats {
  total_alumni: number;
  sudah_mengisi: number;
  belum_mengisi: number;
  bekerja: number;
  kuliah: number;
  berwirausaha: number;
  lainnya: number;
  total_respons: number;
  per_jurusan: { jurusan: string; total: number }[];
  kesesuaian: { sesuai: number; tidak_sesuai: number; dinilai: number };
  aktivitas: DashboardActivity[];
}

export interface AlumniRow {
  id: string;
  nisn: string;
  nik: string | null;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  jurusan: string | null;
  angkatan: number | null;
  email: string | null;
  no_telepon: string | null;
  created_at: string;
}

export interface ResponseRow {
  id: number | string;
  created_at: string;
  nama_lengkap: string | null;
  nisn: string | null;
  nik: string | null;
  jenis_kelamin: string | null;
  jurusan: string | null;
  tahun_lulus: number | null;
  email: string | null;
  no_telepon: string | null;
  status_saat_ini: string | null;
  nama_perusahaan: string | null;
  jabatan: string | null;
  nama_kampus: string | null;
  nama_usaha: string | null;
  kesesuaian_jurusan_skor: number | null;
}

/** Human labels for the identifiers stored in `status_saat_ini`. */
export const STATUS_LABEL: Record<string, string> = {
  bekerja: 'Bekerja',
  kuliah: 'Kuliah',
  wirausaha: 'Wirausaha',
  belum_bekerja: 'Belum Bekerja',
  bekerja_kuliah: 'Bekerja & Kuliah',
  kuliah_wirausaha: 'Kuliah & Wirausaha',
};

/** Which pill tone each status wears in the tables. */
export const STATUS_TONE: Record<string, 'work' | 'study' | 'business' | 'idle'> = {
  bekerja: 'work',
  bekerja_kuliah: 'work',
  kuliah: 'study',
  wirausaha: 'business',
  kuliah_wirausaha: 'business',
  belum_bekerja: 'idle',
};

const EMPTY: DashboardStats = {
  total_alumni: 0,
  sudah_mengisi: 0,
  belum_mengisi: 0,
  bekerja: 0,
  kuliah: 0,
  berwirausaha: 0,
  lainnya: 0,
  total_respons: 0,
  per_jurusan: [],
  kesesuaian: { sesuai: 0, tidak_sesuai: 0, dinilai: 0 },
  aktivitas: [],
};

/** One round trip for the whole Overview page (see `admin_dashboard()`). */
export async function fetchDashboard(angkatan: number | null): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('admin_dashboard', {
    p_angkatan: angkatan,
  });
  if (error) throw error;
  return { ...EMPTY, ...(data as Partial<DashboardStats>) };
}

export interface Page<T> {
  rows: T[];
  total: number;
}

/** Roster page for "Akun Siswa". */
export async function fetchAlumni(
  opts: { search?: string; page?: number; pageSize?: number } = {},
): Promise<Page<AlumniRow>> {
  const { search = '', page = 1, pageSize = 8 } = opts;
  const from = (page - 1) * pageSize;

  let q = supabase
    .from('alumni')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`nama_lengkap.ilike.${term},nisn.ilike.${term},jurusan.ilike.${term}`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as AlumniRow[], total: count ?? 0 };
}

export interface ResponseFilters {
  search?: string;
  jurusan?: string;
  angkatan?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/** Response page for "Data Kuisioner". */
export async function fetchResponses(f: ResponseFilters = {}): Promise<Page<ResponseRow>> {
  const { search = '', jurusan = '', angkatan = '', status = '', page = 1, pageSize = 8 } = f;
  const from = (page - 1) * pageSize;

  let q = supabase
    .from('tracer_study')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (jurusan) q = q.eq('jurusan', jurusan);
  if (angkatan) q = q.eq('tahun_lulus', Number(angkatan));
  if (status) q = q.eq('status_saat_ini', status);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`nama_lengkap.ilike.${term},nisn.ilike.${term},jurusan.ilike.${term}`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as ResponseRow[], total: count ?? 0 };
}

/** Distinct graduation years, for the filter dropdowns. */
export async function fetchAngkatanOptions(): Promise<number[]> {
  const { data, error } = await supabase
    .from('alumni')
    .select('angkatan')
    .not('angkatan', 'is', null);
  if (error) throw error;
  const years = new Set<number>();
  for (const row of data ?? []) if (row.angkatan) years.add(row.angkatan as number);
  return [...years].sort((a, b) => b - a);
}

export async function deleteAlumni(id: string): Promise<void> {
  const { error } = await supabase.from('alumni').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertAlumni(row: Partial<AlumniRow>): Promise<void> {
  const { error } = await supabase.from('alumni').upsert(row, { onConflict: 'nisn' });
  if (error) throw error;
}

/**
 * Bulk import for "Impor Siswa".
 *
 * Accepts a CSV whose header names match the alumni columns (nisn, nik,
 * nama_lengkap, jenis_kelamin, jurusan, angkatan, email, no_telepon) in any
 * order. Rows are upserted on `nisn`, so re-importing a corrected file updates
 * rather than duplicates. Returns how many rows were written.
 */
export async function importAlumniCsv(text: string): Promise<number> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('File CSV kosong atau hanya berisi header.');

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };

  const header = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const allowed = new Set([
    'nisn', 'nik', 'nama_lengkap', 'jenis_kelamin', 'jurusan', 'angkatan', 'email', 'no_telepon',
  ]);

  const rows = lines.slice(1).map((line) => {
    const cells = splitRow(line);
    const row: Record<string, string | number | null> = {};
    header.forEach((key, i) => {
      if (!allowed.has(key)) return;
      const raw = cells[i] ?? '';
      row[key] = raw === '' ? null : key === 'angkatan' ? Number(raw) : raw;
    });
    return row;
  }).filter((r) => r.nisn && r.nama_lengkap);

  if (!rows.length) throw new Error('Tidak ada baris valid (kolom nisn dan nama_lengkap wajib diisi).');

  const { error } = await supabase.from('alumni').upsert(rows, { onConflict: 'nisn' });
  if (error) throw error;

  await supabase.from('activity_log').insert([
    { kind: 'import', message: `Data alumni berhasil diimport (${rows.length} baris).` },
  ]);

  return rows.length;
}

/** The handful of aggregate numbers the public landing page shows. */
export interface PublicStats {
  total_alumni: number;
  total_respons: number;
  pct_bekerja: number;
  pct_kuliah: number;
  pct_wirausaha: number;
}

/**
 * Readable by anonymous visitors — see migration 0003. Returns counts and
 * percentages only, never rows, so the landing page can show live figures
 * without any read policy on the underlying tables.
 */
export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.rpc('public_tracer_stats');
  if (error) throw error;
  return data as PublicStats;
}
