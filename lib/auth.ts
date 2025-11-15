import { supabase } from './supabase';
import { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  displayName?: string;
  code?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
      mustChangePassword: userData.must_change_password,
      displayName: userData.display_name,
      code: userData.code,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function requireAuth(requiredRole?: UserRole | UserRole[]) {
  return async (user: AuthUser | null): Promise<boolean> => {
    if (!user) {
      return false;
    }

    if (user.mustChangePassword) {
      return false; // Must change password first
    }

    if (!requiredRole) {
      return true; // Any authenticated user
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };
}

