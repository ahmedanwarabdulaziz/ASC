import { createClient } from '@/lib/supabase/server';

/**
 * Get the current authenticated user (server-side)
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if a user is currently authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user;
}
