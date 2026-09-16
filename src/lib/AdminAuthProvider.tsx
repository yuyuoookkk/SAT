import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AdminAuthContext } from './adminAuthContext';
import type { AdminAuth, Approval } from './adminAuthContext';

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
  // Same keying, same reason: an approval answered for the previous account
  // must never be read as this one's.
  const [approvalCheck, setApprovalCheck] = useState<{ uid: string; value: Approval } | null>(null);

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

  /**
   * Ask the database whether this account has been approved (migration 0008).
   *
   * Like the admin check above, this is for messaging rather than security: the
   * INSERT policy on `tracer_study` is the real boundary. So a call that fails
   * — most likely because 0008 has not been applied yet — leaves the answer
   * null, and the UI treats that as "carry on" rather than locking out an
   * alumnus the database would happily accept.
   */
  const readApproval = useCallback(async (forUid: string) => {
    const { data, error } = await supabase.rpc('my_account_status');
    if (error) return;
    const value = data as string;
    if (value === 'pending' || value === 'approved' || value === 'rejected') {
      setApprovalCheck({ uid: forUid, value });
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    void readApproval(uid);
  }, [uid, readApproval]);

  const isAdmin = uid && adminCheck?.uid === uid ? adminCheck.ok : null;
  const approval = uid && approvalCheck?.uid === uid ? approvalCheck.value : null;

  const value = useMemo<AdminAuth>(
    () => ({
      session,
      loading,
      isAdmin,
      approval,
      refreshApproval: async () => {
        if (uid) await readApproval(uid);
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, details) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // Read by the auth.users trigger in migration 0008, so the request is
          // opened with the details an admin needs even when the browser never
          // gets as far as the RPC below.
          options: {
            data: {
              full_name: details?.fullName ?? '',
              nisn: details?.nisn ?? '',
            },
          },
        });
        if (error) throw error;

        // With email confirmation on, Supabase returns a user but no session.
        const activeNow = Boolean(data.session);

        // Belt and braces: on a managed instance the auth.users trigger may not
        // have been creatable, so open the request from here too. Both sides
        // are idempotent, and this one can only ever write a pending row for
        // the calling account.
        if (activeNow) {
          const { error: rpcError } = await supabase.rpc('request_account_approval', {
            p_full_name: details?.fullName ?? null,
            p_nisn: details?.nisn ?? null,
          });
          // A missing function means 0008 is not applied; that is the admin's
          // problem to fix, not a reason to fail a sign-up that succeeded.
          if (!rpcError && data.session?.user?.id) {
            await readApproval(data.session.user.id);
          }
        }

        return activeNow;
      },
      signOut: async () => {
        setApprovalCheck(null);
        setAdminCheck(null);
        await supabase.auth.signOut();
      },
    }),
    [session, loading, isAdmin, approval, uid, readApproval],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
