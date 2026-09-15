-- =============================================================================
-- Require a signed-in account to file a questionnaire response.
--
-- Until now anyone could submit anonymously, which left responses unattributed
-- and made "who has actually answered" impossible to establish. Responses must
-- now belong to an account, so every submission is traceable to an alumnus and
-- shows up against them in the admin.
--
-- Enforced in the database, not only in the UI: a route guard stops the honest
-- path, but the REST endpoint is public and would still accept an anonymous
-- insert. Removing the anon policy is what actually closes it.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'tracer_study'
       and column_name = 'user_id'
  ) then
    raise exception using
      message = 'Apply 0005_user_accounts.sql first.',
      detail  = 'tracer_study.user_id does not exist yet, so a response cannot '
                'be attributed to an account.',
      hint    = 'Run 0002, then 0005, then this file.';
  end if;
end;
$$;

-- Anonymous visitors may no longer submit.
drop policy if exists "public may submit questionnaire" on public.tracer_study;

-- A signed-in alumnus may file a response only as themselves. The previous
-- version also allowed `user_id is null`, which left an unattributed row
-- possible; that allowance is gone.
drop policy if exists "users submit as themselves" on public.tracer_study;
create policy "users submit as themselves"
  on public.tracer_study for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or public.is_admin()
  );

-- Existing anonymous rows keep working: the column stays nullable so historic
-- submissions are not invalidated, and admins can still read them.
comment on column public.tracer_study.user_id is
  'Account that filed the response. NULL only for rows created before '
  'migration 0007, when anonymous submission was still permitted.';
