-- =============================================================================
-- Restrict admin access to an explicit allowlist.
--
-- Migration 0001 granted reads to *any* `authenticated` user. On a project with
-- public sign-ups that means a stranger can register an account and then read
-- every alumni record. This replaces "is logged in" with "is on the list".
--
-- Bootstrapping: every account that already exists is enrolled below, since at
-- this point the only accounts are ones you created yourself. Accounts created
-- AFTER this migration are not admins until you add them.
--
-- Safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The allowlist
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  note       text,
  created_at timestamptz not null default now()
);

-- Enroll existing accounts so this migration cannot lock you out.
insert into public.admin_users (user_id, email, note)
select id, email, 'auto-enrolled by migration 0002'
  from auth.users
on conflict (user_id) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Membership test
--
--    SECURITY DEFINER on purpose: admin_users is itself protected by RLS, and a
--    policy that queried it directly would recurse. Running as the owner reads
--    the table once, cleanly.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- 3. Never allow the last admin to be removed — that would lock everyone out
--    of the dashboard with no way back in except the SQL editor.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.admin_users) <= 1 then
    raise exception 'Cannot remove the last admin. Add another admin first.';
  end if;
  return old;
end;
$$;

drop trigger if exists admin_users_keep_one on public.admin_users;
create trigger admin_users_keep_one
  before delete on public.admin_users
  for each row execute function public.prevent_last_admin_removal();

-- -----------------------------------------------------------------------------
-- 4. Swap every admin policy from "any authenticated user" to "on the list"
-- -----------------------------------------------------------------------------
alter table public.admin_users enable row level security;

drop policy if exists "admins read allowlist" on public.admin_users;
create policy "admins read allowlist"
  on public.admin_users for select to authenticated using (public.is_admin());

drop policy if exists "admins manage allowlist" on public.admin_users;
create policy "admins manage allowlist"
  on public.admin_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tracer_study — the public INSERT policy from 0001 is deliberately untouched,
-- so the questionnaire keeps working for anonymous visitors.
drop policy if exists "admins read responses" on public.tracer_study;
create policy "admins read responses"
  on public.tracer_study for select to authenticated using (public.is_admin());

drop policy if exists "admins manage responses" on public.tracer_study;
create policy "admins manage responses"
  on public.tracer_study for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete responses" on public.tracer_study;
create policy "admins delete responses"
  on public.tracer_study for delete to authenticated using (public.is_admin());

-- alumni
drop policy if exists "admins manage roster" on public.alumni;
create policy "admins manage roster"
  on public.alumni for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- activity_log
drop policy if exists "admins read activity" on public.activity_log;
create policy "admins read activity"
  on public.activity_log for select to authenticated using (public.is_admin());

drop policy if exists "admins write activity" on public.activity_log;
create policy "admins write activity"
  on public.activity_log for insert to authenticated with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Adding or removing an admin later
--
--     insert into public.admin_users (user_id, email)
--     select id, email from auth.users where email = 'someone@example.com';
--
--     delete from public.admin_users where email = 'someone@example.com';
-- -----------------------------------------------------------------------------
