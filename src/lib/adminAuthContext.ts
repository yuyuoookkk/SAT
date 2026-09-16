import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

/** Where a sign-up stands with the school — migration 0008. */
export type Approval = 'pending' | 'approved' | 'rejected';

export interface SignUpDetails {
  /** Shown to the admin deciding on the request. */
  fullName?: string;
  /** Matched against the alumni roster, so the admin has something to check. */
  nisn?: string;
}

export interface AdminAuth {
  session: Session | null;
  loading: boolean;
  /**
   * Whether the signed-in user is on the `admin_users` allowlist.
   * `null` means "not determined" — see AdminAuthProvider for why that is
   * treated as permissive in the UI.
   */
  isAdmin: boolean | null;
  /**
   * Whether an admin has approved this account to fill in the questionnaire.
   * `null` means "not determined" — same reasoning as isAdmin: the INSERT
   * policy is the real boundary, so an unanswered check must not lock out a
   * correctly-approved alumnus.
   */
  approval: Approval | null;
  /** Re-asks the database; used by the "sudah disetujui?" button. */
  refreshApproval: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the account is usable immediately, false when
   *  Supabase is waiting on email confirmation. */
  signUp: (email: string, password: string, details?: SignUpDetails) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export const useAdminAuth = (): AdminAuth => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
};
