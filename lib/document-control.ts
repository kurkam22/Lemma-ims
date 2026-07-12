import type { SupabaseClient } from '@supabase/supabase-js'

// Document-control helpers. Both functions FAIL SOFT: if the tables don't
// exist yet (migration not run), they log a warning and return null instead
// of breaking the save flow.

export type DocumentVersion = {
  id: string
  document_id: string
  version_no: number
  content: string
  note: string | null
  created_by_email: string | null
  created_at: string
}

export type DocumentEvent = {
  id: string
  document_id: string
  action: string
  detail: string | null
  actor_email: string | null
  created_at: string
}

export const EVENT_LABELS: Record<string, string> = {
  created: 'Created',
  edited: 'Content edited',
  submitted_for_review: 'Submitted for review',
  approved: 'Approved',
  sent_back_to_draft: 'Sent back to draft',
  marked_obsolete: 'Marked obsolete',
  reopened_as_draft: 'Reopened as draft',
  version_restored: 'Older version restored',
}

async function actor(supabase: SupabaseClient): Promise<{ id: string | null; email: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  return { id: user?.id ?? null, email: user?.email ?? null }
}

/** Snapshot the current content as the next version. Returns the new version number or null. */
export async function snapshotVersion(
  supabase: SupabaseClient,
  args: { companyId: string; documentId: string; content: string; note?: string }
): Promise<number | null> {
  try {
    const { count, error: cErr } = await supabase
      .from('document_versions')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', args.documentId)
    if (cErr) throw cErr
    const next = (count ?? 0) + 1
    const who = await actor(supabase)
    const { error } = await supabase.from('document_versions').insert({
      document_id: args.documentId,
      company_id: args.companyId,
      version_no: next,
      content: args.content,
      note: args.note ?? null,
      created_by: who.id,
      created_by_email: who.email,
    })
    if (error) throw error
    return next
  } catch (e) {
    console.warn('Version snapshot skipped (run migration_document_control.sql?):', e)
    return null
  }
}

/** Record an audit-trail event. Never throws. */
export async function logEvent(
  supabase: SupabaseClient,
  args: { companyId: string; documentId: string; action: string; detail?: string }
): Promise<void> {
  try {
    const who = await actor(supabase)
    await supabase.from('document_events').insert({
      document_id: args.documentId,
      company_id: args.companyId,
      action: args.action,
      detail: args.detail ?? null,
      actor_id: who.id,
      actor_email: who.email,
    })
  } catch (e) {
    console.warn('Audit event skipped (run migration_document_control.sql?):', e)
  }
}

export async function loadVersions(
  supabase: SupabaseClient,
  documentId: string
): Promise<DocumentVersion[]> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('id, document_id, version_no, content, note, created_by_email, created_at')
      .eq('document_id', documentId)
      .order('version_no', { ascending: false })
    if (error) throw error
    return (data ?? []) as DocumentVersion[]
  } catch {
    return []
  }
}

export async function loadEvents(
  supabase: SupabaseClient,
  documentId: string
): Promise<DocumentEvent[]> {
  try {
    const { data, error } = await supabase
      .from('document_events')
      .select('id, document_id, action, detail, actor_email, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as DocumentEvent[]
  } catch {
    return []
  }
}
