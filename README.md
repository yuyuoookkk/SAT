# Tracer Study Alumni — SMK TI Bali Global Jimbaran

React + TypeScript + Vite front end for the alumni Tracer Study questionnaire,
plus an admin dashboard backed by Supabase.

- `/` — public landing page
- `/tracer-form` — four-step questionnaire (identitas → informasi → evaluasi → selesai)
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

`supabase/migrations/0001_admin_schema.sql` creates the `alumni` roster and
`activity_log`, extends `tracer_study` with every questionnaire field, adds the
`admin_dashboard()` aggregate, and enables Row Level Security. It is additive
and idempotent — existing rows are preserved and backfilled.

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
2. **Turn off public sign-ups** (Authentication → Providers → Email), or the
   policies' "any authenticated user" rule lets a stranger register and read
   everything. For a stricter setup, gate the policies on an `admin_users`
   allowlist instead of `using (true)`.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck (`tsc -b`) then production build |
| `npm run lint` | Oxlint |
| `npm run preview` | serve the production build |
