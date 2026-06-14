import { createClient } from '@/lib/supabase/server'

/**
 * Per-user daily limits for routes that call the Anthropic API.
 * Backed by the public.ai_usage table (see supabase/migration_ai_usage.sql).
 *
 * Fails open if the table doesn't exist yet, so deploying this code
 * before running the migration won't break the app — it just won't
 * limit until the table is created.
 */

const DAILY_LIMITS: Record<string, number> = {
  generate: 40, // full document generations / day / user
  check: 40, // compliance checks / day / user
  classify: 200, // evidence classifications / day / user
  agenda: 20, // management review agendas / day / user
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; limit: number; used: number }

export async function checkRateLimit(
  userId: string,
  action: keyof typeof DAILY_LIMITS
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[action] ?? 50
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  try {
    const { data, error } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('action', action)
      .eq('day', today)
      .maybeSingle()

    if (error) {
      // Table missing or RLS issue — don't take the feature down over it.
      console.warn('[rate-limit] read failed, allowing request:', error.message)
      return { allowed: true }
    }

    const used = data?.count ?? 0
    if (used >= limit) {
      return { allowed: false, limit, used }
    }

    // Upsert the incremented counter. Race conditions can slightly
    // overshoot the limit; acceptable for cost control purposes.
    await supabase.from('ai_usage').upsert(
      { user_id: userId, action, day: today, count: used + 1 },
      { onConflict: 'user_id,action,day' }
    )

    return { allowed: true }
  } catch (e) {
    console.warn('[rate-limit] unexpected error, allowing request:', e)
    return { allowed: true }
  }
}

export function rateLimitResponse(r: { limit: number; used: number }) {
  return new Response(
    JSON.stringify({
      error: `Daily AI limit reached (${r.limit}/day). Try again tomorrow or contact support.`,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  )
}
