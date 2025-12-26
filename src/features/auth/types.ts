import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'staff';

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createOrganization: (name: string) => Promise<{ error: Error | null }>;
  joinOrganization: (organizationId: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}
