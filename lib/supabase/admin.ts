import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabase Admin Client (Service Role)
 *
 * SERVER-ONLY — never import this in Client Components or any file
 * that may be bundled for the browser.
 *
 * Uses the service-role key which bypasses RLS completely.
 * Only use this for:
 *   - Audit log writes (must never be blocked by RLS)
 *   - Administrative seeding or maintenance tasks
 *   - Server actions that intentionally need to bypass user-level RLS
 *
 * The service-role key is read from SUPABASE_SERVICE_ROLE_KEY (server env only).
 * It must NOT be prefixed with NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[admin client] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (server-only, never NEXT_PUBLIC_).'
    );
  }

  // The admin client does not need cookie-based session management.
  // It always authenticates as the service role.
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
