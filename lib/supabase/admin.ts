import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client using the service-role key. SERVER ONLY — never import this
 * from client components. Used by scheduled jobs (reminder emails) that must
 * read across companies without a user session. RLS is bypassed, so every
 * query here must be written with care.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
