import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthContextValue, Profile, Organization, AppRole } from '../types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile(profileData as Profile | null);

      // Fetch organization if profile has one
      if (profileData?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .maybeSingle();

        setOrganization(orgData as Organization | null);
      } else {
        setOrganization(null);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      setRoles((rolesData || []).map((r) => r.role as AppRole));
    } catch {
      // Intentionally swallow here: missing SELECT policies can temporarily return empty
      // and we don't want to crash the app.
      setProfile(null);
      setOrganization(null);
      setRoles([]);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [user?.id, fetchUserData]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setOrganization(null);
    setRoles([]);
  };

  const createOrganization = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const orgId = crypto.randomUUID();

      // Create organization (avoid SELECT-after-INSERT so RLS doesn't block)
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: orgId, name });

      if (orgError) throw orgError;

      // Link profile to org
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      if (roleError) throw roleError;

      await fetchUserData(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const joinOrganization = async (organizationId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const orgId = organizationId.trim();
      if (!orgId) return { error: new Error('Organization ID is required') };

      // Link profile to org (we don't SELECT the org here; after linking, SELECT will be allowed)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Default role for joiners
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'staff' });

      // Ignore unique violation if role already exists
      const roleCode = (roleError as any)?.code?.toString?.();
      if (roleError && roleCode !== '23505') {
        throw roleError;
      }

      await fetchUserData(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');

  const value: AuthContextValue = {
    user,
    session,
    profile,
    organization,
    roles,
    isLoading,
    isAuthenticated: !!user,
    hasOrganization: !!organization,
    signIn,
    signUp,
    signOut,
    createOrganization,
    joinOrganization,
    hasRole,
    isAdmin,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
