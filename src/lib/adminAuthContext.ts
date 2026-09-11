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
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export const useAdminAuth = (): AdminAuth => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
};
