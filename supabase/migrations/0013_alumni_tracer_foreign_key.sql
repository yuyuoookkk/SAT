-- =============================================================================
-- Make alumni ← tracer_study a real foreign key.
--
-- The two tables were already related by NISN, but only by convention: nothing
-- in the database stopped a response carrying a NISN that belonged to nobody,
-- and nothing kept the two sides in step when a NISN was corrected. This turns
-- that convention into a constraint Postgres enforces.
--
-- WHY IT COULD NOT SIMPLY BE ADDED
--
-- An alumnus is allowed to answer before the school has entered them in the
-- roster; the trigger from 0004 adds them afterwards. But that trigger is
-- AFTER INSERT, and a foreign key is checked BEFORE the triggers run — so a
-- plain `add constraint` rejects exactly the submissions the trigger exists to
-- accommodate:
--
--     ERROR: insert or update on table "tracer_study" violates foreign key
--     DETAIL: Key (nisn)=(0099887766) is not present in table "alumni".
--
-- The fix is order, not compromise: move the trigger to BEFORE INSERT so the
-- roster row is created first and the key it points at exists by the time the
-- constraint is checked. Behaviour for the alumnus is unchanged.
--
-- Safe to run more than once. Requires 0004.
-- =============================================================================

do $$
begin
  if to_regprocedure('public.sync_alumni_from_submission()') is null then
    raise exception using
      message = 'Apply 0004_link_submissions_to_roster.sql first.',
      detail  = 'The roster-sync trigger is what makes this foreign key possible.',
      hint    = 'Run 0004, then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Tidy the key columns before constraining them
--
--    A NISN stored as '0071234567 ' and one stored as '0071234567' are
--    different strings to a foreign key, and the whole constraint would fail on
--    a single stray space typed months ago.
-- -----------------------------------------------------------------------------
update public.alumni
   set nisn = btrim(nisn)
 where nisn <> btrim(nisn);

update public.tracer_study
   set nisn = btrim(nisn)
 where nisn is not null and nisn <> btrim(nisn);

-- An empty string is not a key; it is a missing value wearing a disguise.
update public.tracer_study
   set nisn = null
 where nisn is not null and btrim(nisn) = '';

-- -----------------------------------------------------------------------------
-- 2. Give every existing response a roster row to point at
--
--    0004 backfilled once, but responses filed since then — or rows whose NISN
--    only just lost its whitespace above — may still have no match.
-- -----------------------------------------------------------------------------
insert into public.alumni (
  nisn, nama_lengkap, jenis_kelamin, jurusan, angkatan, email, no_telepon, alamat
)
select distinct on (t.nisn)
       t.nisn,
       coalesce(t.nama_lengkap, 'Alumni ' || t.nisn),
       t.jenis_kelamin, t.jurusan, t.tahun_lulus, t.email, t.no_telepon, t.alamat
  from public.tracer_study t
 where t.nisn is not null
   and not exists (select 1 from public.alumni a where a.nisn = t.nisn)
 order by t.nisn, t.created_at desc
on conflict (nisn) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Move the sync trigger ahead of the constraint check
--
--    Same function as 0004 with two changes: it runs BEFORE, and it normalises
--    `new.nisn` on the way past. Only a BEFORE trigger may alter the row, and
--    without that normalisation a submitted ' 0071234567 ' would be trimmed
--    into `alumni` but left untrimmed in `tracer_study` — two different keys,
--    and the foreign key would refuse the row.
-- -----------------------------------------------------------------------------
create or replace function public.sync_alumni_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.nisn is null or btrim(new.nisn) = '' then
    new.nisn := null;
    return new;
  end if;

  new.nisn := btrim(new.nisn);

  insert into public.alumni as a (
    nisn, nama_lengkap, jenis_kelamin, jurusan, angkatan, email, no_telepon, alamat
  )
  values (
    new.nisn, new.nama_lengkap, new.jenis_kelamin, new.jurusan,
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
  before insert on public.tracer_study
  for each row execute function public.sync_alumni_from_submission();

-- -----------------------------------------------------------------------------
-- 4. The foreign key
--
--    ON UPDATE CASCADE — correcting a mistyped NISN in the roster carries the
--    responses with it. Without this, the correction would simply be refused.
--
--    ON DELETE SET NULL — removing someone from the roster keeps their answers.
--    They are the point of the whole system, and losing survey data to a tidy-up
--    would be the worst outcome here. CASCADE would delete them; RESTRICT would
--    block the admin's delete button with an error they cannot act on.
-- -----------------------------------------------------------------------------
do $$
begin
  alter table public.tracer_study
    add constraint tracer_study_nisn_fkey
    foreign key (nisn) references public.alumni (nisn)
    on update cascade
    on delete set null;
exception
  when duplicate_object then null;
end;
$$;

-- The foreign key is checked on every delete from `alumni`, so the referencing
-- side needs an index or each delete scans the whole response table.
create index if not exists tracer_study_nisn_fk_idx on public.tracer_study (nisn);

comment on constraint tracer_study_nisn_fkey on public.tracer_study is
  'Every response belongs to a roster entry. The BEFORE INSERT trigger creates '
  'that entry first when the alumnus is new, so answering before the school has '
  'imported you still works.';
