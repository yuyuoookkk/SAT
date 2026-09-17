-- =============================================================================
-- Presence: who is on the site right now.
--
-- "Akun Siswa" shows each alumnus as Aktif / Tidak Aktif. Until now that meant
-- "has filed a questionnaire response", which is a permanent fact, not a state
-- — once Aktif, always Aktif. It now means what it says: this alumnus has the
-- site open.
--
-- Done with a heartbeat rather than Supabase Realtime presence, because
-- presence state held in memory dies with the connection: a refresh would blank
-- the board, and an admin looking at the roster ten minutes later would learn
-- nothing. A stored timestamp survives both, and doubles as "last seen" for
-- everyone who is offline.
--
-- Safe to run more than once. Requires 0008.
-- =============================================================================

do $$
begin
  if to_regclass('public.account_requests') is null then
    raise exception using
      message = 'Apply 0008_account_approval.sql first.',
      detail  = 'Presence is a property of an account, and account_requests is '
                'what ties an account to a roster entry by NISN.',
      hint    = 'Run 0008 (and 0009), then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. The heartbeat table
-- -----------------------------------------------------------------------------
create table if not exists public.user_presence (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create index if not exists user_presence_last_seen_idx
  on public.user_presence (last_seen_at desc);

comment on table public.user_presence is
  'Last time each account was seen with the site open. Written only by '
  'public.touch_presence(), which stamps the calling account and no other.';

-- Keep the roster join below cheap.
create index if not exists account_requests_nisn_idx on public.account_requests (nisn);

-- -----------------------------------------------------------------------------
-- 2. The heartbeat itself
--
--    SECURITY DEFINER, and it takes no arguments on purpose: the row it writes
--    is always `auth.uid()`, so an account cannot report someone else as
--    present. There is no INSERT or UPDATE policy on the table for anyone —
--    this function is the only way in.
-- -----------------------------------------------------------------------------
create or replace function public.touch_presence()
returns timestamptz
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  seen timestamptz;
begin
  if uid is null then
    return null;
  end if;

  insert into public.user_presence (user_id, last_seen_at)
  values (uid, now())
  on conflict (user_id) do update set last_seen_at = now()
  returning last_seen_at into seen;

  return seen;
end;
$$;

revoke execute on function public.touch_presence() from public;
grant execute on function public.touch_presence() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. How long a heartbeat counts for.
--
--    The browser beats every 45 seconds while the tab is visible, so the window
--    has to be comfortably longer than that or a single dropped request would
--    blink someone offline. Two minutes allows two missed beats.
--
--    Kept as a function so the view and any future caller cannot disagree about
--    it; change it here and everything follows.
-- -----------------------------------------------------------------------------
create or replace function public.presence_window()
returns interval
language sql
immutable
as $$ select interval '2 minutes' $$;

-- -----------------------------------------------------------------------------
-- 4. Roster view, now carrying presence
--
--    An alumnus is matched to their account two ways: the NISN they gave when
--    signing up, and the NISN on any response they filed. Either is enough —
--    an approved alumnus who has not answered yet still shows as online, which
--    is the whole point of the change.
--
--    `sudah_mengisi` stays exactly as it was. It is a different question, still
--    worth asking, and the "Akun Siswa" filters now ask both.
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
     select r.user_id from public.account_requests r where r.nisn = a.nisn
     union
     select t.user_id from public.tracer_study t
      where t.nisn = a.nisn and t.user_id is not null
   )
) pr on true;

revoke all on public.admin_alumni_overview from public;
grant select on public.admin_alumni_overview to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Row-level security
--
--    Reads only, and only your own row unless you are an admin. Nobody writes
--    directly; section 2 is the only door.
-- -----------------------------------------------------------------------------
alter table public.user_presence enable row level security;

drop policy if exists "users read own presence" on public.user_presence;
create policy "users read own presence"
  on public.user_presence for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "admins read presence" on public.user_presence;
create policy "admins read presence"
  on public.user_presence for select to authenticated
  using (public.is_admin());

grant select on public.user_presence to authenticated;
