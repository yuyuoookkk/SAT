import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AdminAuthContext } from './adminAuthContext';
import type { AdminAuth } from './adminAuthContext';

/**
 * Admin session.
 *
 * The dashboard shows NISN, NIK and phone numbers, and the Supabase anon key is
 * public (it ships inside the JS bundle), so the row-level security policies in
 * migration 0001 grant reads only to the `authenticated` role. Signing in here
 * is what makes those reads work at all — it is not cosmetic.
 */
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Stored against the user id it was resolved for, so a previous account's
  // answer can never be read as the current one during a sign-out/sign-in.
  const [adminCheck, setAdminCheck] = useState<{ uid: string; ok: boolean } | null>(null);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Ask the database whether this user is on the allowlist (migration 0002).
  //
  // This check is for messaging, not security — RLS is the real boundary, and a
  // non-admin already reads nothing. So if the call itself fails (for instance
  // migration 0002 has not been applied and the function is absent) we leave
  // this null and let the user through to a dashboard the database will simply
  // return no rows for, rather than locking out a correctly-configured admin.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;

    let alive = true;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!alive || error) return;
      setAdminCheck({ uid, ok: Boolean(data) });
    });

    return () => {
      alive = false;
    };
  }, [session]);

  const uid = session?.user?.id;
  const isAdmin = uid && adminCheck?.uid === uid ? adminCheck.ok : null;

  const value = useMemo<AdminAuth>(
    () => ({
      session,
      loading,
      isAdmin,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, isAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
