import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AdminAuth {
  session: Session | null;
  loading: boolean;
  /**
   * Whether the signed-in user is on the `admin_users` allowlist.
   * `null` means "not determined" — see AdminAuthProvider for why that is
   * treated as permissive in the UI.
   */
  isAdmin: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the account is usable immediately, false when
   *  Supabase is waiting on email confirmation. */
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export const useAdminAuth = (): AdminAuth => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
};
