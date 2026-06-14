import { createClient } from '@/lib/supabase/server'

export type AuthResult =
  | { ok: true; userId: string; companyId: string }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Verifies the request comes from a signed-in user and resolves their
 * company. Every API route that costs money (Anthropic calls) or touches
 * company data must call this first.
 *
 * If `expectedCompanyId` is passed, it must match the caller's own
 * company — prevents one tenant generating documents against another
 * tenant's id.
 */
export async function requireUser(
  expectedCompanyId?: string
): Promise<AuthResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!userRow?.company_id) {
    return { ok: false, status: 403, error: 'No company linked to user' }
  }

  if (expectedCompanyId && userRow.company_id !== expectedCompanyId) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  return { ok: true, userId: user.id, companyId: userRow.company_id }
}

export function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
