-- =============================================================================
-- Alumni Tracer Study — admin schema
--
-- Safe to run against an existing database: every statement is additive and
-- guarded with IF NOT EXISTS. Nothing is dropped and no existing column is
-- retyped, so current `tracer_study` rows survive untouched.
--
-- Apply with:  supabase db push      (or paste into the SQL editor)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Alumni roster
--    The master list of graduates. "Total Alumni" on the dashboard counts this
--    table; "Sudah Mengisi" counts distinct NISNs that appear in tracer_study.
-- -----------------------------------------------------------------------------
create table if not exists public.alumni (
  id            uuid primary key default gen_random_uuid(),
  nisn          text not null unique,
  nik           text,
  nama_lengkap  text not null,
  jenis_kelamin text check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  jurusan       text,
  angkatan      integer,
  email         text,
  no_telepon    text,
  alamat        text,
  created_at    timestamptz not null default now()
);

create index if not exists alumni_angkatan_idx on public.alumni (angkatan);
create index if not exists alumni_jurusan_idx  on public.alumni (jurusan);

-- -----------------------------------------------------------------------------
-- 2. Extend tracer_study with every field the Figma form collects
-- -----------------------------------------------------------------------------
alter table public.tracer_study
  add column if not exists created_at                timestamptz not null default now(),
  add column if not exists nik                       text,
  add column if not exists jenis_kelamin             text,
  add column if not exists jurusan                   text,
  add column if not exists email                     text,
  add column if not exists alamat                    text,
  -- karir / pekerjaan
  add column if not exists bidang_perusahaan         text,
  add column if not exists tanggal_mulai_kerja       date,
  add column if not exists rentang_gaji              text,
  add column if not exists kota_kerja                text,
  add column if not exists cara_memperoleh_pekerjaan text,
  add column if not exists kepuasan_kerja            smallint,
  -- pendidikan lanjut
  add column if not exists jenjang_pendidikan        text,
  add column if not exists status_perguruan_tinggi   text,
  add column if not exists sumber_pembiayaan         text,
  add column if not exists tahun_masuk_kuliah        date,
  add column if not exists kesesuaian_jurusan_kuliah smallint,
  add column if not exists kepuasan_kuliah           smallint,
  -- wirausaha
  add column if not exists legalitas_usaha           text,
  add column if not exists mulai_usaha               date,
  add column if not exists kota_usaha                text,
  add column if not exists omset_bulanan             text,
  add column if not exists jumlah_karyawan           integer,
  add column if not exists sumber_modal              text,
  add column if not exists kesesuaian_jurusan_usaha  smallint,
  add column if not exists perkembangan_usaha        smallint,
  -- belum bekerja
  add column if not exists lama_menunggu             text,
  add column if not exists channel_melamar           text,
  add column if not exists jumlah_lamaran            text,
  add column if not exists kendala_utama             text,
  add column if not exists kebutuhan_program         text,
  -- evaluasi
  add column if not exists rating_guru               smallint,
  add column if not exists rating_pkl                smallint,
  add column if not exists rating_skill              smallint,
  add column if not exists rating_disiplin           smallint,
  -- numeric twin of the pre-existing text column `kesesuaian_jurusan`,
  -- so the Link & Match index can be computed without retyping that column
  add column if not exists kesesuaian_jurusan_skor   smallint;

create index if not exists tracer_study_created_at_idx on public.tracer_study (created_at desc);
create index if not exists tracer_study_nisn_idx       on public.tracer_study (nisn);
create index if not exists tracer_study_status_idx     on public.tracer_study (status_saat_ini);

-- -----------------------------------------------------------------------------
-- 3. Activity feed ("Aktivitas Terakhir")
-- -----------------------------------------------------------------------------
create table if not exists public.activity_log (
  id         bigserial primary key,
  kind       text not null default 'submission'
               check (kind in ('submission', 'import', 'admin')),
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

-- Every questionnaire submission writes its own feed entry.
create or replace function public.log_tracer_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_log (kind, message)
  values ('submission',
          coalesce(new.nama_lengkap, 'Seorang alumni') ||
          ' baru saja mengisi kuisioner Tracer Study.');
  return new;
end;
$$;

drop trigger if exists tracer_study_activity on public.tracer_study;
create trigger tracer_study_activity
  after insert on public.tracer_study
  for each row execute function public.log_tracer_submission();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
--
--    IMPORTANT: the anon key ships inside the built JavaScript bundle and is
--    therefore public. These policies are what actually stop a stranger from
--    dumping the roster (which holds NISN, NIK and phone numbers). The public
--    site may INSERT a questionnaire response and nothing else; all reads
--    require a signed-in admin.
-- -----------------------------------------------------------------------------
alter table public.alumni       enable row level security;
alter table public.tracer_study enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "public may submit questionnaire" on public.tracer_study;
create policy "public may submit questionnaire"
  on public.tracer_study for insert to anon, authenticated with check (true);

-- NOTE: anon may INSERT but never SELECT, so the public form must call
-- `.insert(...)` WITHOUT chaining `.select()`. Chaining it makes PostgREST ask
-- for `Prefer: return=representation`, which needs a SELECT policy and fails
-- with a confusing "new row violates row-level security policy". Granting anon
-- SELECT to work around that would expose every response — don't.

drop policy if exists "admins read responses" on public.tracer_study;
create policy "admins read responses"
  on public.tracer_study for select to authenticated using (true);

drop policy if exists "admins manage responses" on public.tracer_study;
create policy "admins manage responses"
  on public.tracer_study for update to authenticated using (true) with check (true);

drop policy if exists "admins delete responses" on public.tracer_study;
create policy "admins delete responses"
  on public.tracer_study for delete to authenticated using (true);

drop policy if exists "admins manage roster" on public.alumni;
create policy "admins manage roster"
  on public.alumni for all to authenticated using (true) with check (true);

drop policy if exists "admins read activity" on public.activity_log;
create policy "admins read activity"
  on public.activity_log for select to authenticated using (true);

drop policy if exists "admins write activity" on public.activity_log;
create policy "admins write activity"
  on public.activity_log for insert to authenticated with check (true);

-- -----------------------------------------------------------------------------
-- 5. Dashboard aggregate — one round trip for the whole Overview page.
--    SECURITY INVOKER, so RLS still applies: an anonymous caller sees zeros.
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard(p_angkatan integer default null)
returns json
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_total     bigint;
  v_filled    bigint;
  v_bekerja   bigint;
  v_kuliah    bigint;
  v_wirausaha bigint;
  v_lainnya   bigint;
  v_responses bigint;
begin
  select count(*) into v_total
    from alumni a
   where p_angkatan is null or a.angkatan = p_angkatan;

  select count(distinct t.nisn) into v_filled
    from tracer_study t
   where p_angkatan is null or t.tahun_lulus = p_angkatan;

  select
    count(*) filter (where status_saat_ini in ('bekerja', 'bekerja_kuliah')),
    count(*) filter (where status_saat_ini in ('kuliah')),
    count(*) filter (where status_saat_ini in ('wirausaha', 'kuliah_wirausaha')),
    count(*) filter (where status_saat_ini not in
      ('bekerja', 'bekerja_kuliah', 'kuliah', 'wirausaha', 'kuliah_wirausaha')
      or status_saat_ini is null),
    count(*)
  into v_bekerja, v_kuliah, v_wirausaha, v_lainnya, v_responses
    from tracer_study t
   where p_angkatan is null or t.tahun_lulus = p_angkatan;

  return json_build_object(
    'total_alumni',   v_total,
    'sudah_mengisi',  v_filled,
    'belum_mengisi',  greatest(v_total - v_filled, 0),
    'bekerja',        v_bekerja,
    'kuliah',         v_kuliah,
    'berwirausaha',   v_wirausaha,
    'lainnya',        v_lainnya,
    'total_respons',  v_responses,

    'per_jurusan', coalesce((
      select json_agg(x order by x.jurusan)
        from (select coalesce(nullif(t.jurusan, ''), 'Lainnya') as jurusan,
                     count(*) as total
                from tracer_study t
               where p_angkatan is null or t.tahun_lulus = p_angkatan
               group by 1) x
    ), '[]'::json),

    'kesesuaian', (
      select json_build_object(
        'sesuai',       count(*) filter (where kesesuaian_jurusan_skor >= 4),
        'tidak_sesuai', count(*) filter (where kesesuaian_jurusan_skor is not null
                                           and kesesuaian_jurusan_skor < 4),
        'dinilai',      count(*) filter (where kesesuaian_jurusan_skor is not null))
        from tracer_study t
       where p_angkatan is null or t.tahun_lulus = p_angkatan
    ),

    'aktivitas', coalesce((
      select json_agg(y)
        from (select kind, message, created_at
                from activity_log
               order by created_at desc
               limit 5) y
    ), '[]'::json)
  );
end;
$$;

grant execute on function public.admin_dashboard(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Backfill the roster from questionnaire responses already on file
-- -----------------------------------------------------------------------------
insert into public.alumni (nisn, nama_lengkap, jurusan, angkatan, no_telepon)
select distinct on (t.nisn)
       t.nisn, t.nama_lengkap, t.jurusan, t.tahun_lulus, t.no_telepon
  from public.tracer_study t
 where t.nisn is not null and t.nisn <> ''
 order by t.nisn, t.created_at desc
on conflict (nisn) do nothing;
