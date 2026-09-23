-- =============================================================================
-- Three faults in the Aktif / Tidak Aktif column, found on a live screen.
--
-- 1. THE ADMIN LIT UP ALUMNI ROWS. 0011 taught the view to match an account to
--    a roster row by email. The school's own address had been typed into
--    several roster rows as a placeholder, so the admin sitting on the
--    dashboard — heartbeating, as any signed-in page does — turned those rows
--    green. They never went dark either, because the admin never left.
--
-- 2. NOTHING CHANGED WHEN THE TAB CLOSED. A closed tab sends nothing, so the
--    only way back to "Tidak Aktif" was waiting out the whole window. At two
--    minutes that reads as broken.
--
-- 3. THE WINDOW WAS TOO LONG for the thing it describes.
--
-- Safe to run more than once. Requires 0011.
-- =============================================================================

do $$
begin
  if to_regprocedure('public.presence_window()') is null then
    raise exception using
      message = 'Apply 0010 and 0011 first.',
      detail  = 'presence_window() does not exist yet.',
      hint    = 'Run 0010, 0011, then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. A shorter window
--
--    The browser now beats every 20 seconds, so 60 tolerates two dropped
--    requests and still turns over quickly enough that a person watching the
--    screen believes it.
-- -----------------------------------------------------------------------------
create or replace function public.presence_window()
returns interval
language sql
immutable
as $$ select interval '60 seconds' $$;

-- -----------------------------------------------------------------------------
-- 2. Leaving on purpose
--
--    Called as the tab is hidden or closed. Rather than delete the row — which
--    would throw away "terakhir dilihat" — it backdates the heartbeat to just
--    outside the window, so the account reads as away immediately while its
--    last-seen time stays roughly honest.
-- -----------------------------------------------------------------------------
create or replace function public.end_presence()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  update public.user_presence
     set last_seen_at = now() - public.presence_window() - interval '1 second'
   where user_id = uid
     and last_seen_at > now() - public.presence_window();
end;
$$;

revoke execute on function public.end_presence() from public;
grant execute on function public.end_presence() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Which accounts may light which roster row
--
--    Kept as its own function so the rule is stated once and the view stays
--    readable.
--
--    NISN is exact, so it is trusted outright. Email is a guess, so it carries
--    two guards:
--
--      * it must be unambiguous — an address sitting on two roster rows names
--        nobody, so it matches nobody;
--      * it must not belong to an admin — a school address pasted into roster
--        rows is precisely how the dashboard lit itself up. An admin who is
--        genuinely an alumnus still matches on their NISN.
-- -----------------------------------------------------------------------------
create or replace function public.presence_for_roster(p_nisn text, p_email text)
returns timestamptz
language sql
stable
security definer
set search_path = public, auth
as $$
  with kandidat as (
    select r.user_id
      from public.account_requests r
     where r.nisn = p_nisn
    union
    select t.user_id
      from public.tracer_study t
     where t.user_id is not null and t.nisn = p_nisn
    union
    -- The email path, guarded.
    select r.user_id
      from public.account_requests r
     where p_email is not null
       and btrim(p_email) <> ''
       and lower(btrim(r.email)) = lower(btrim(p_email))
       and not exists (
         select 1 from public.admin_users au where au.user_id = r.user_id
       )
       and (
         select count(*) from public.alumni a2
          where lower(btrim(a2.email)) = lower(btrim(p_email))
       ) = 1
  )
  select max(p.last_seen_at)
    from public.user_presence p
    join kandidat k on k.user_id = p.user_id;
$$;

grant execute on function public.presence_for_roster(text, text) to authenticated;

comment on function public.presence_for_roster(text, text) is
  'Latest heartbeat from any account that belongs to this roster row. NISN '
  'matches outright; email matches only when it is unique to one roster row '
  'and does not belong to an admin.';

-- -----------------------------------------------------------------------------
-- 4. The view
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
  select public.presence_for_roster(a.nisn, a.email) as last_seen_at
) pr on true;

revoke all on public.admin_alumni_overview from public;
grant select on public.admin_alumni_overview to authenticated;
