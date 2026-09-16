-- =============================================================================
-- Collect a full identity at sign-up.
--
-- 0008 asked a new account for a name and a NISN. That is thin ground for an
-- admin deciding whether to let someone into the roster, so a sign-up now also
-- carries NIK, jurusan, WhatsApp number and sex — the same identity the school
-- already holds for its alumni, so the two can actually be compared.
--
-- Safe to run more than once. Requires 0008.
-- =============================================================================

do $$
begin
  if to_regclass('public.account_requests') is null then
    raise exception using
      message = 'Apply 0008_account_approval.sql first.',
      detail  = 'There is no account_requests table to add these columns to.',
      hint    = 'Run 0008, then this file.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Normalisers
--
--    Sign-up details arrive from a browser and are written by a SECURITY
--    DEFINER function, so bad input must not raise: an exception there would
--    surface *after* the account was already created, leaving the alumnus with
--    a login and no request. A value that does not look right is therefore
--    stored as "not provided" rather than rejected, and the admin sees the gap.
-- -----------------------------------------------------------------------------
create or replace function public.digits_between(p_text text, p_min int, p_max int)
returns text
language sql
immutable
as $$
  select case when d ~ ('^[0-9]{' || p_min || ',' || p_max || '}$') then d end
    from (select regexp_replace(coalesce(p_text, ''), '\D', '', 'g') as d) s;
$$;

comment on function public.digits_between(text, int, int) is
  'Digits only, kept only if the count falls in range; otherwise NULL.';

-- -----------------------------------------------------------------------------
-- 2. The extra columns
-- -----------------------------------------------------------------------------
alter table public.account_requests
  add column if not exists nik           text,
  add column if not exists jurusan       text,
  add column if not exists jenis_kelamin text,
  add column if not exists no_telepon    text;

do $$
begin
  alter table public.account_requests
    add constraint account_requests_nisn_format
    check (nisn is null or nisn ~ '^[0-9]{10}$');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.account_requests
    add constraint account_requests_nik_format
    check (nik is null or nik ~ '^[0-9]{16}$');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.account_requests
    add constraint account_requests_jenis_kelamin
    check (jenis_kelamin is null or jenis_kelamin in ('Laki-laki', 'Perempuan'));
exception when duplicate_object then null;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Capture the lot from the sign-up metadata
--
--    Two rules here, both learned the hard way. Every value is put through the
--    same normalisers the constraints enforce, rather than trusted — an
--    unrecognised `jenis_kelamin` tripped the CHECK and took the whole
--    auth.users INSERT down with it, so the sign-up failed outright.
--
--    And the whole body is wrapped: this trigger runs inside the transaction
--    that creates the account, so anything it raises costs the alumnus their
--    account entirely. A request that cannot be opened here is recoverable —
--    the RPC in section 4 opens it on the next sign-in — but a failed sign-up
--    is not.
-- -----------------------------------------------------------------------------
create or replace function public.open_account_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.account_requests (
    user_id, email, full_name, nisn, nik, jurusan, jenis_kelamin, no_telepon
  )
  values (
    new.id,
    new.email,
    nullif(m ->> 'full_name', ''),
    public.digits_between(m ->> 'nisn', 10, 10),
    public.digits_between(m ->> 'nik', 16, 16),
    nullif(m ->> 'jurusan', ''),
    case when m ->> 'jenis_kelamin' in ('Laki-laki', 'Perempuan')
         then m ->> 'jenis_kelamin' end,
    public.digits_between(m ->> 'no_telepon', 9, 15)
  )
  on conflict (user_id) do nothing;
  return new;
exception
  when others then
    raise warning 'Could not open an account request for % (%). The sign-up '
                  'still succeeded; request_account_approval() will open it.',
                  new.id, sqlerrm;
    return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. The client-side twin
--
--    The old two-argument form is dropped rather than left as an overload: two
--    functions of the same name, one of which silently discards half of what
--    a caller sends, is a trap.
--
--    Still write-once, for the same reason as in 0008 — a pending account must
--    not be able to change what an admin is looking at.
-- -----------------------------------------------------------------------------
drop function if exists public.request_account_approval(text, text);

create or replace function public.request_account_approval(
  p_full_name     text default null,
  p_nisn          text default null,
  p_nik           text default null,
  p_jurusan       text default null,
  p_jenis_kelamin text default null,
  p_no_telepon    text default null
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

  insert into public.account_requests (
    user_id, email, full_name, nisn, nik, jurusan, jenis_kelamin, no_telepon
  )
  select
    uid,
    u.email,
    nullif(p_full_name, ''),
    public.digits_between(p_nisn, 10, 10),
    public.digits_between(p_nik, 16, 16),
    nullif(p_jurusan, ''),
    case when p_jenis_kelamin in ('Laki-laki', 'Perempuan') then p_jenis_kelamin end,
    public.digits_between(p_no_telepon, 9, 15)
    from auth.users u where u.id = uid
  on conflict (user_id) do update
     set full_name     = coalesce(public.account_requests.full_name, excluded.full_name),
         nisn          = coalesce(public.account_requests.nisn, excluded.nisn),
         nik           = coalesce(public.account_requests.nik, excluded.nik),
         jurusan       = coalesce(public.account_requests.jurusan, excluded.jurusan),
         jenis_kelamin = coalesce(public.account_requests.jenis_kelamin, excluded.jenis_kelamin),
         no_telepon    = coalesce(public.account_requests.no_telepon, excluded.no_telepon)
   where public.account_requests.status = 'pending'
     and (public.account_requests.full_name is null
          or public.account_requests.nisn is null
          or public.account_requests.nik is null
          or public.account_requests.jurusan is null
          or public.account_requests.jenis_kelamin is null
          or public.account_requests.no_telepon is null);

  select status into current_status
    from public.account_requests where user_id = uid;

  return coalesce(current_status, 'pending');
end;
$$;

revoke execute on function public.request_account_approval(text, text, text, text, text, text)
  from public;
grant execute on function public.request_account_approval(text, text, text, text, text, text)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Admin listing
--
--    `jurusan` and `angkatan` stay what the ROSTER says, because that is what
--    the "cocok / tidak cocok" verdict is about. What the applicant typed is
--    exposed separately, so a mismatch is visible rather than averaged away.
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
  case r.status when 'pending' then 0 when 'rejected' then 1 else 2 end as urutan,
  coalesce(r.full_name, a.nama_lengkap)  as full_name,
  coalesce(r.nisn, a.nisn)               as nisn,
  coalesce(r.nik, a.nik)                 as nik,
  r.jenis_kelamin                        as jenis_kelamin,
  r.no_telepon                           as no_telepon,
  r.jurusan                              as jurusan_pendaftar,
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
