-- =============================================================================
-- Create (or reset) an admin sign-in for the Tracer Study dashboard.
--
-- This is deliberately NOT a migration. It needs a password supplied at run
-- time, which `supabase db push` cannot provide — and keeping the password out
-- of the repository is the whole point, since this repo is public.
--
-- HOW TO RUN
--
--   Supabase SQL editor — paste this file, put the line below in front of it,
--   and run the whole thing in one go:
--
--       set app.admin_password = 'choose-a-strong-password';
--
--   psql — pass it as a startup option so it never lands in your shell history
--   as part of the file:
--
--       PGOPTIONS="-c app.admin_password=choose-a-strong-password" \
--         psql "$DATABASE_URL" -f supabase/create_admin.sql
--
--   The email defaults to admin@smktibaliglobal. Override it the same way:
--
--       set app.admin_email = 'admin@smktibaliglobal.sch.id';
--
--   NOTE: "admin@smktibaliglobal" has no top-level domain. The insert accepts
--   it and browsers accept it, but some GoTrue versions validate the address on
--   sign-in and reject it. If login fails with an "invalid email" style error,
--   re-run with app.admin_email set to admin@smktibaliglobal.sch.id.
--
-- Safe to run repeatedly: an existing account with that address has its
-- password reset rather than being duplicated. Use it to rotate the password
-- too.
-- =============================================================================

do $$
declare
  v_email    text := coalesce(nullif(current_setting('app.admin_email', true), ''),
                              'admin@smktibaliglobal');
  v_password text := nullif(current_setting('app.admin_password', true), '');
  v_user_id  uuid;
  v_has_provider_id boolean;
  v_hash     text;
begin
  if v_password is null then
    raise exception
      'No password supplied. Run "set app.admin_password = ''your-password'';" first, then run this file again.';
  end if;

  if length(v_password) < 8 then
    raise exception 'Password must be at least 8 characters.';
  end if;

  -- pgcrypto lives in the `extensions` schema on Supabase and in `public`
  -- elsewhere; look through both so crypt()/gen_salt() resolve either way.
  perform set_config('search_path', 'public, extensions, auth', true);

  -- Cost 10 matches GoTrue's own default, so the hash verifies normally.
  v_hash := crypt(v_password, gen_salt('bf', 10));

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is not null then
    update auth.users
       set encrypted_password = v_hash,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_user_id;

    raise notice 'Admin % already existed — password reset.', v_email;
  else
    v_user_id := gen_random_uuid();

    -- Only long-stable columns are named. Everything else (tokens, phone
    -- fields, flags) is left to its column default, and the generated column
    -- `confirmed_at` must never be written to.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin"}'::jsonb,
      now(),
      now()
    );

    -- GoTrue also needs a matching row in auth.identities for password login.
    -- `provider_id` only exists on newer versions, hence the branch.
    select exists (
      select 1 from information_schema.columns
       where table_schema = 'auth' and table_name = 'identities'
         and column_name = 'provider_id'
    ) into v_has_provider_id;

    if v_has_provider_id then
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_user_id::text, v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    else
      insert into auth.identities (
        id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_user_id::text, v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    end if;

    raise notice 'Admin % created.', v_email;
  end if;
end
$$;
