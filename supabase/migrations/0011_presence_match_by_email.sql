-- =============================================================================
-- Make Aktif / Tidak Aktif actually light up.
--
-- 0010 linked an account to a roster row by NISN alone. That misses every
-- account created before 0009 asked for one — including every row the backfill
-- in 0008 wrote, which carries an email and nothing else. Those alumni could
-- heartbeat all day and still read as "Tidak Aktif", because the view had no
-- way to tell which roster row they belonged to.
--
-- Two fixes: match on email as well as NISN, and fill in the NISN that was
-- missing so the direct path works from now on.
--
-- Safe to run more than once. Requires 0010.
-- =============================================================================

do $$
begin
  if to_regclass('public.user_presence') is null then
    raise exception using
      message = 'Apply 0010_user_presence.sql first.',
      detail  = 'There is no presence table for this migration to join to.',
      hint    = 'Run 0008, 0009, 0010, then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. One-time repair: give existing sign-ups the NISN the roster already knows.
--
--    Only fills NULLs, and only where exactly one roster row carries that
--    email — an ambiguous match is left alone rather than guessed at.
-- -----------------------------------------------------------------------------
update public.account_requests r
   set nisn = m.nisn
  from (
    select lower(btrim(a.email)) as email, min(a.nisn) as nisn
      from public.alumni a
     where a.email is not null and btrim(a.email) <> ''
     group by lower(btrim(a.email))
    having count(*) = 1
  ) m
 where r.nisn is null
   and r.email is not null
   and lower(btrim(r.email)) = m.email;

-- -----------------------------------------------------------------------------
-- 2. Indexes for the email side of the join
-- -----------------------------------------------------------------------------
create index if not exists account_requests_email_lower_idx
  on public.account_requests (lower(btrim(email)));

create index if not exists tracer_study_email_lower_idx
  on public.tracer_study (lower(btrim(email)));

create index if not exists alumni_email_lower_idx
  on public.alumni (lower(btrim(email)));

-- -----------------------------------------------------------------------------
-- 3. The view, now matching on either identifier
--
--    An alumnus is "here" if ANY account tied to their roster row has beaten
--    recently, whether that account was tied by the NISN it registered with,
--    the NISN on a response it filed, or the email address on either.
-- -----------------------------------------------------------------------------
create or replace view public.admin_alumni_overview
with (security_invoker = true) as
select
  a.id,
  a.nisn,
  a.nik,
  a.nama_lengkap,
  a.jenis_kelamin,
  a.jurusan,
  a.angkatan,
  a.email,
  a.no_telepon,
  a.created_at,
  exists (
    select 1 from public.tracer_study t where t.nisn = a.nisn
  ) as sudah_mengisi,
  (
    select max(t.created_at) from public.tracer_study t where t.nisn = a.nisn
  ) as terakhir_mengisi,
  pr.last_seen_at,
  (pr.last_seen_at is not null
   and pr.last_seen_at > now() - public.presence_window()) as sedang_online
from public.alumni a
left join lateral (
  select max(p.last_seen_at) as last_seen_at
    from public.user_presence p
   where p.user_id in (
     select r.user_id
       from public.account_requests r
      where r.nisn = a.nisn
         or (a.email is not null and btrim(a.email) <> ''
             and lower(btrim(r.email)) = lower(btrim(a.email)))
     union
     select t.user_id
       from public.tracer_study t
      where t.user_id is not null
        and (t.nisn = a.nisn
             or (a.email is not null and btrim(a.email) <> ''
                 and lower(btrim(t.email)) = lower(btrim(a.email))))
   )
) pr on true;

revoke all on public.admin_alumni_overview from public;
grant select on public.admin_alumni_overview to authenticated;

comment on view public.admin_alumni_overview is
  'Roster with engagement and presence. An account is tied to a roster row by '
  'NISN or by email, on either the sign-up request or a filed response.';
