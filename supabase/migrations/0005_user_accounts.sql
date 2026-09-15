-- =============================================================================
-- Alumni user accounts.
--
-- Adds the ability for an alumnus to hold an account, and links a questionnaire
-- response to whoever submitted it so they can read their own answers back.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Refuse to run without the allowlist.
--
--    Migration 0001 grants reads to ANY `authenticated` user. Opening sign-ups
--    while that is still true would let anyone who registers read every alumni
--    record. 0002 replaces those policies with an admin allowlist, so it is a
--    hard prerequisite here rather than a suggestion.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception using
      message = 'Apply 0002_admin_allowlist.sql first.',
      detail  = 'Without it, admin policies still read "any authenticated user", '
                'so enabling sign-ups would expose every alumni record to anyone '
                'who registers an account.',
      hint    = 'Run supabase/migrations/0002_admin_allowlist.sql, then re-run this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Attribute a response to the account that submitted it.
--    Nullable on purpose: the questionnaire stays open to anonymous visitors.
-- -----------------------------------------------------------------------------
alter table public.tracer_study
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists tracer_study_user_id_idx on public.tracer_study (user_id);

-- -----------------------------------------------------------------------------
-- 2. A signed-in alumnus may read back their own submission — and only that.
--
--    This is additive: the admin SELECT policy from 0002 still applies, and
--    Postgres ORs permissive policies together. A registered user who is not an
--    admin therefore sees their own row and nothing else.
-- -----------------------------------------------------------------------------
drop policy if exists "users read own submission" on public.tracer_study;
create policy "users read own submission"
  on public.tracer_study for select to authenticated
  using (user_id = (select auth.uid()));

-- A user may only ever file a response as themselves.
--
-- 0001's insert policy was `to anon, authenticated with check (true)`. Postgres
-- ORs permissive policies together, so simply adding a stricter one alongside
-- it changed nothing — a signed-in user could still post a response stamped
-- with someone else's user_id. The public policy is therefore narrowed to
-- `anon` (which is all the public form needs) and authenticated inserts are
-- governed by the check below.
drop policy if exists "public may submit questionnaire" on public.tracer_study;
create policy "public may submit questionnaire"
  on public.tracer_study for insert to anon with check (true);

drop policy if exists "users submit as themselves" on public.tracer_study;
create policy "users submit as themselves"
  on public.tracer_study for insert to authenticated
  with check (
    user_id is null
    or user_id = (select auth.uid())
    or public.is_admin()
  );
