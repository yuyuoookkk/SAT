import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AdminAuth {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export const useAdminAuth = (): AdminAuth => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
};
