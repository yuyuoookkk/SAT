-- =============================================================================
-- Admin approval for alumni accounts.
--
-- Signing up is now a *request*. A new account can log in, but cannot file a
-- questionnaire response until an admin approves it. This stops the roster
-- being filled by anyone who finds the URL, and gives the school a moment to
-- check that a sign-up really is one of its alumni.
--
-- Enforced in the database, not only in the UI. The route guard stops the
-- honest path; the PostgREST endpoint is public and would happily accept an
-- insert from an unapproved account, so the INSERT policy is what actually
-- closes it.
--
-- Safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Prerequisites
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception using
      message = 'Apply 0002_admin_allowlist.sql first.',
      detail  = 'Approval is an admin-only decision, and there is no definition '
                'of "admin" without the allowlist.',
      hint    = 'Run 0002, then 0005, then 0007, then this file.';
  end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'tracer_study'
       and column_name = 'user_id'
  ) then
    raise exception using
      message = 'Apply 0005_user_accounts.sql first.',
      detail  = 'tracer_study.user_id does not exist, so a response cannot be '
                'tied to the account whose approval we are checking.',
      hint    = 'Run 0002, then 0005, then 0007, then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. The request table
--
--    One row per account, keyed by the account itself — an alumnus has exactly
--    one standing with the school, not a queue of requests.
-- -----------------------------------------------------------------------------
create table if not exists public.account_requests (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  nisn         text,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  note         text,
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references auth.users(id) on delete set null
);

create index if not exists account_requests_status_idx
  on public.account_requests (status, requested_at desc);

comment on table public.account_requests is
  'Sign-up requests awaiting an admin decision. A row must reach status '
  '''approved'' before its account may submit a questionnaire response.';

-- -----------------------------------------------------------------------------
-- 2. Stamp who decided, and when.
--
--    Done in a trigger rather than trusted to the client: the admin UI sends
--    only the new status, so the audit fields cannot be forged or forgotten.
-- -----------------------------------------------------------------------------
create or replace function public.stamp_account_decision()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.status is distinct from old.status then
    new.decided_at := now();
    new.decided_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists account_requests_stamp on public.account_requests;
create trigger account_requests_stamp
  before update on public.account_requests
  for each row execute function public.stamp_account_decision();

-- -----------------------------------------------------------------------------
-- 3. Open a request whenever an account is created.
--
--    `on conflict do nothing` keeps this idempotent, and keeps it from fighting
--    with the RPC in section 4 — whichever runs first wins, the other no-ops.
-- -----------------------------------------------------------------------------
create or replace function public.open_account_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.account_requests (user_id, email, full_name, nisn)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'nisn', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Creating a trigger on auth.users needs rights this role may not hold on a
-- managed instance. It is a convenience, not the mechanism — section 4 covers
-- the same ground from the client — so a failure here is reported and stepped
-- over rather than aborting the migration.
do $$
begin
  drop trigger if exists on_auth_user_created_request on auth.users;
  create trigger on_auth_user_created_request
    after insert on auth.users
    for each row execute function public.open_account_request();
exception
  when insufficient_privilege or undefined_table then
    raise warning 'Could not add the auth.users trigger (%). Requests will be '
                  'opened by public.request_account_approval() instead, which '
                  'the sign-up page calls.', sqlerrm;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Let an account open its own request.
--
--    Called by the sign-up page. SECURITY DEFINER so it can write a row the
--    caller has no INSERT policy for, but it can only ever write a row for
--    `auth.uid()` — the caller cannot name someone else — and it can only
--    create a pending one, never approve anything.
--
--    The details are write-once. An earlier version overwrote them on conflict,
--    which let a pending account change the NISN after an admin had already
--    seen it in the queue: look up a real alumnus, then approve a stranger. So
--    a field is only ever filled in when it is still empty, and nothing moves
--    once a decision has been made.
-- -----------------------------------------------------------------------------
create or replace function public.request_account_approval(
  p_full_name text default null,
  p_nisn      text default null
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  current_status text;
begin
  if uid is null then
    raise exception 'Not signed in.';
  end if;

  insert into public.account_requests (user_id, email, full_name, nisn)
  select uid, u.email, nullif(p_full_name, ''), nullif(p_nisn, '')
    from auth.users u where u.id = uid
  on conflict (user_id) do update
     set full_name = coalesce(public.account_requests.full_name, excluded.full_name),
         nisn      = coalesce(public.account_requests.nisn, excluded.nisn)
   where public.account_requests.status = 'pending'
     and (public.account_requests.full_name is null
          or public.account_requests.nisn is null);

  select status into current_status
    from public.account_requests where user_id = uid;

  return coalesce(current_status, 'pending');
end;
$$;

revoke execute on function public.request_account_approval(text, text) from public;
grant execute on function public.request_account_approval(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. The two questions the rest of the system asks
-- -----------------------------------------------------------------------------

-- May this account submit? Admins always may; they are the ones approving.
create or replace function public.is_account_approved()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin() or exists (
    select 1 from public.account_requests
     where user_id = auth.uid() and status = 'approved'
  );
$$;

grant execute on function public.is_account_approved() to authenticated;

-- What should the account be told? Returns 'approved', 'pending' or 'rejected'.
--
-- An account with no row at all reads as 'pending': the safe direction, and the
-- only way to get there is a trigger that did not fire.
create or replace function public.my_account_status()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when auth.uid() is null then 'anonymous'
    when public.is_admin() then 'approved'
    else coalesce(
      (select status from public.account_requests where user_id = auth.uid()),
      'pending'
    )
  end;
$$;

grant execute on function public.my_account_status() to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Row-level security
-- -----------------------------------------------------------------------------
alter table public.account_requests enable row level security;

-- An alumnus may read their own standing, and nothing else. They may not write
-- it — there is no INSERT or UPDATE policy for them on purpose, so the only
-- routes in are the trigger and the RPC above, both of which force 'pending'.
drop policy if exists "users read own request" on public.account_requests;
create policy "users read own request"
  on public.account_requests for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "admins read requests" on public.account_requests;
create policy "admins read requests"
  on public.account_requests for select to authenticated
  using (public.is_admin());

drop policy if exists "admins decide requests" on public.account_requests;
create policy "admins decide requests"
  on public.account_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.account_requests to authenticated;
grant update (status, note) on public.account_requests to authenticated;

-- -----------------------------------------------------------------------------
-- 7. The gate itself
--
--    Replaces 0007's policy. Same shape, one added condition: the account must
--    be approved. Dropped and recreated rather than added alongside, because
--    Postgres ORs permissive policies together — a second, stricter policy
--    would have changed nothing.
-- -----------------------------------------------------------------------------
drop policy if exists "users submit as themselves" on public.tracer_study;
create policy "users submit as themselves"
  on public.tracer_study for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and public.is_account_approved())
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 8. Admin listing
--
--    Joins the roster so an admin deciding on a sign-up can see whether the
--    NISN given is one the school actually holds — without that, "approve?" is
--    a question about an email address and nothing else.
--
--    security_invoker: the view runs with the caller's rights, so the policies
--    in section 6 apply to it. Without this it would run as owner and hand
--    every request to every signed-in user.
-- -----------------------------------------------------------------------------
drop view if exists public.admin_account_requests;
create view public.admin_account_requests
with (security_invoker = true) as
select
  r.user_id,
  r.email,
  r.status,
  r.note,
  r.requested_at,
  r.decided_at,
  -- PostgREST can only sort by a column, and alphabetical order would bury the
  -- queue ('approved' sorts before 'pending'). So the order the screen wants is
  -- a column.
  case r.status when 'pending' then 0 when 'rejected' then 1 else 2 end as urutan,
  coalesce(r.full_name, a.nama_lengkap)  as full_name,
  coalesce(r.nisn, a.nisn)               as nisn,
  a.id is not null                       as cocok_roster,
  a.jurusan                              as jurusan,
  a.angkatan                             as angkatan,
  exists (
    select 1 from public.tracer_study t where t.user_id = r.user_id
  )                                      as sudah_mengisi
from public.account_requests r
left join public.alumni a on a.nisn = r.nisn;

grant select on public.admin_account_requests to authenticated;

comment on view public.admin_account_requests is
  'Sign-up requests with roster matching, for the admin approval screen.';

-- -----------------------------------------------------------------------------
-- 9. Backfill
--
--    Every account that exists right now predates approval, and locking out the
--    accounts already in use would be a regression rather than a safeguard. So
--    they are approved, and the rule applies to sign-ups from here on.
-- -----------------------------------------------------------------------------
insert into public.account_requests (user_id, email, status, note, decided_at)
select u.id, u.email, 'approved', 'auto-approved by migration 0008', now()
  from auth.users u
on conflict (user_id) do nothing;
