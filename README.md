# Tracer Study Alumni — SMK TI Bali Global Jimbaran

React + TypeScript + Vite front end for the alumni Tracer Study questionnaire,
plus an admin dashboard backed by Supabase.

- `/` — public landing page
- `/tracer-form` — four-step questionnaire, requires a signed-in alumnus so
  every response is attributable
- `/admin` — dashboard overview, `/admin/akun-siswa`, `/admin/data-kuisioner`

## Setup

```bash
npm install
cp .env.example .env    # then fill in your Supabase project values
npm run dev
```

`.env` needs:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Database

Apply the migration once:

```bash
supabase db push
```

- `0001_admin_schema.sql` creates the `alumni` roster and `activity_log`,
  extends `tracer_study` with every questionnaire field, adds the
  `admin_dashboard()` aggregate, and enables Row Level Security.
- `0002_admin_allowlist.sql` restricts admin access to the `admin_users`
  table, so being signed in is no longer enough — see below.
- `0004_link_submissions_to_roster.sql` keeps `alumni` in step with the
  questionnaire: submitting the public form now creates or updates the roster
  row, so a respondent appears under "Akun Siswa" straight away and the
  Total/Sudah/Belum counts stay honest. Also constrains `nisn` to 10 digits
  (added NOT VALID, so existing rows are untouched).
- `0007_require_login_to_submit.sql` requires a signed-in account to file a
  response: the anon insert policy is removed and a response must carry the
  submitter's own `user_id`. Apply it after 0005, which it checks for.
- `0006_admin_alumni_overview.sql` adds the view behind the "Akun Siswa"
  table, carrying each alumnus's Aktif / Tidak Aktif state. That state is
  derived (has the alumnus filed a response?) rather than stored, so it cannot
  drift. The view sets `security_invoker = true`; without it a view runs with
  its owner's rights and would hand the whole roster to any caller.
- `0003_public_stats.sql` adds `public_tracer_stats()`, the only thing an
  anonymous visitor may call. It returns aggregate counts and percentages and
  never a row, so the landing page can show live figures while the underlying
  tables stay unreadable.

Both are additive and idempotent; existing rows are preserved and backfilled.

### Creating an admin sign-in

`supabase/create_admin.sql` is a manual script, not a migration, because the
password is supplied at run time and must never be committed.

In the Supabase SQL editor, paste the file with this line in front of it and run
both together:

```sql
set app.admin_password = 'choose-a-strong-password';
```

Or from psql:

```bash
PGOPTIONS="-c app.admin_password=choose-a-strong-password" \
  psql "$DATABASE_URL" -f supabase/create_admin.sql
```

The email defaults to `admin@smktibaliglobal`; override with
`set app.admin_email = '...'`. Re-running the script resets the password, so
use it to rotate credentials too.

## Security notes

The `VITE_SUPABASE_ANON_KEY` is public — it ships inside the built JavaScript.
The RLS policies in migration 0001 are therefore the only thing protecting
alumni records (NISN, NIK, phone numbers, emails):

- the public site may **INSERT** a questionnaire response and nothing else;
- every **read** requires an authenticated admin.

Two consequences worth knowing:

1. **Do not chain `.select()` onto the public insert.** It would request
   `RETURNING`, which needs a SELECT policy, and fails with a misleading
   "violates row-level security" error. Granting `anon` SELECT to work around
   that would expose every response.
2. **Admin access is an explicit allowlist.** Migration 0002 replaced "any
   authenticated user" with membership of `public.admin_users`, so a stranger
   registering through public sign-up reads nothing. Accounts existing when
   0002 ran were enrolled automatically.

### Managing admins

```sql
-- grant
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'someone@example.com';

-- revoke
delete from public.admin_users where email = 'someone@example.com';

-- who has access
select email, created_at from public.admin_users order by created_at;
```

Removing the final admin is blocked by a trigger, so you cannot lock yourself
out of the dashboard. A signed-in user who is not on the list is shown an
explicit "not an admin" screen rather than an empty dashboard.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck (`tsc -b`) then production build |
| `npm run lint` | Oxlint |
| `npm run preview` | serve the production build |

## Supabase MCP server

`.mcp.json` registers Supabase's hosted MCP server at project scope. It holds no
credential — the project ref is public, and access is granted per developer
through OAuth.

It is configured **read-only**, with the feature groups narrowed to
`docs,database,debugging`. The `account`, `branching`, `development` and
`functions` groups are deliberately left out: this project ref points at the
production database holding real alumni records, and nothing in day-to-day work
here needs an agent to deploy functions, create branches or alter the project.

To use it, install the CLI and authenticate once from inside the repo:

```bash
npm install -g @anthropic-ai/claude-code
cd /path/to/SAT
claude
```

Then type `/mcp`, pick **supabase**, and complete the browser sign-in.

After authenticating, confirm the restriction held: `/mcp` should list read
tools only. If you can see a migration-applying or SQL-writing tool, the
read-only flag did not take effect — re-check the current parameter name in
Supabase's MCP setup guide before using it against production.
