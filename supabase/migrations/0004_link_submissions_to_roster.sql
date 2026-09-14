-- =============================================================================
-- Connect the public questionnaire to the admin roster.
--
-- Until now a submission only landed in `tracer_study`. Anyone who filled the
-- form without already being in `alumni` never appeared under "Akun Siswa", and
-- "Total Alumni" / "Belum Mengisi" counted them wrongly. This keeps the roster
-- in step automatically.
--
-- SECURITY DEFINER is required, not a shortcut: the submitter is `anon`, who
-- deliberately has no write policy on `alumni`. The function only ever writes
-- the row matching the NISN just submitted.
-- =============================================================================

create or replace function public.sync_alumni_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nothing to key on; leave the roster alone.
  if new.nisn is null or btrim(new.nisn) = '' then
    return new;
  end if;

  insert into public.alumni as a (
    nisn, nama_lengkap, jenis_kelamin, jurusan, angkatan, email, no_telepon, alamat
  )
  values (
    btrim(new.nisn), new.nama_lengkap, new.jenis_kelamin, new.jurusan,
    new.tahun_lulus, new.email, new.no_telepon, new.alamat
  )
  on conflict (nisn) do update set
    -- The alumnus's own submission is the fresher source for their details,
    -- but a blank answer must never wipe what the school already imported.
    nama_lengkap  = coalesce(excluded.nama_lengkap,  a.nama_lengkap),
    jenis_kelamin = coalesce(excluded.jenis_kelamin, a.jenis_kelamin),
    jurusan       = coalesce(excluded.jurusan,       a.jurusan),
    angkatan      = coalesce(excluded.angkatan,      a.angkatan),
    email         = coalesce(excluded.email,         a.email),
    no_telepon    = coalesce(excluded.no_telepon,    a.no_telepon),
    alamat        = coalesce(excluded.alamat,        a.alamat);

  return new;
end;
$$;

drop trigger if exists tracer_study_sync_alumni on public.tracer_study;
create trigger tracer_study_sync_alumni
  after insert on public.tracer_study
  for each row execute function public.sync_alumni_from_submission();

-- -----------------------------------------------------------------------------
-- Backfill: pull in anyone who already submitted but is missing from the roster.
-- -----------------------------------------------------------------------------
insert into public.alumni (nisn, nama_lengkap, jenis_kelamin, jurusan, angkatan, email, no_telepon, alamat)
select distinct on (t.nisn)
       btrim(t.nisn), t.nama_lengkap, t.jenis_kelamin, t.jurusan,
       t.tahun_lulus, t.email, t.no_telepon, t.alamat
  from public.tracer_study t
 where t.nisn is not null and btrim(t.nisn) <> ''
 order by t.nisn, t.created_at desc
on conflict (nisn) do nothing;

-- -----------------------------------------------------------------------------
-- NISN shape. Added NOT VALID so existing rows are left alone; anything written
-- or updated from now on must be exactly 10 digits.
-- -----------------------------------------------------------------------------
alter table public.alumni drop constraint if exists alumni_nisn_10_digits;
alter table public.alumni
  add constraint alumni_nisn_10_digits check (nisn ~ '^[0-9]{10}$') not valid;
