-- =============================================================================
-- A roster view carrying engagement state, for the "Akun Siswa" table.
--
-- The table shows each alumnus as Aktif / Tidak Aktif. That is derived, not
-- stored: "Aktif" means the alumnus has filed at least one questionnaire
-- response. Deriving it keeps the flag honest — there is no separate field to
-- drift out of step with reality.
--
-- security_invoker = true is essential. A view defaults to running with its
-- owner's rights, which would bypass RLS entirely and hand the whole roster to
-- any caller. With it set, the caller's own policies on `alumni` and
-- `tracer_study` apply, so a non-admin still sees nothing.
-- =============================================================================

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
  ) as terakhir_mengisi
from public.alumni a;

-- The view inherits nothing automatically; grant reads to the roles that have
-- policies capable of returning rows through it.
revoke all on public.admin_alumni_overview from public;
grant select on public.admin_alumni_overview to authenticated;
