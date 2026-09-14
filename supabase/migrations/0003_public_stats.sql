-- =============================================================================
-- Public statistics for the landing page.
--
-- The landing page is seen by anonymous visitors, who (correctly) have no read
-- policy on `tracer_study` or `alumni`. This exposes just the handful of
-- aggregate numbers that page displays, and nothing else.
--
-- SECURITY DEFINER is deliberate and is the narrow, intended use of it: the
-- function returns only integer counts and percentages. It never returns a row,
-- a name, a NISN, or any other field, so it cannot be used to read records.
-- EXECUTE is revoked from PUBLIC and granted explicitly, rather than relying on
-- Postgres' default of granting EXECUTE to everyone.
-- =============================================================================

create or replace function public.public_tracer_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with r as (
    select
      count(*) filter (where status_saat_ini in ('bekerja', 'bekerja_kuliah'))     as bekerja,
      count(*) filter (where status_saat_ini = 'kuliah')                           as kuliah,
      count(*) filter (where status_saat_ini in ('wirausaha', 'kuliah_wirausaha')) as wirausaha,
      count(*)                                                                     as total
      from public.tracer_study
  )
  select json_build_object(
    'total_alumni',  (select count(*) from public.alumni),
    'total_respons', r.total,
    'pct_bekerja',   case when r.total > 0 then round(r.bekerja   * 100.0 / r.total) else 0 end,
    'pct_kuliah',    case when r.total > 0 then round(r.kuliah    * 100.0 / r.total) else 0 end,
    'pct_wirausaha', case when r.total > 0 then round(r.wirausaha * 100.0 / r.total) else 0 end
  )
  from r;
$$;

revoke execute on function public.public_tracer_stats() from public;
grant execute on function public.public_tracer_stats() to anon, authenticated;
