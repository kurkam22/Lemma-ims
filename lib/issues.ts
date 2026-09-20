// "Report a problem" — pure helpers (no database, no React) so they can be
// tested on their own.
//
// Honesty rules baked in (platform rules 1, 2 and 3):
//  - Clause suggestions come from a FIXED table, not from AI guesses.
//  - They name clause numbers only. No ISO text is copied; the "why" lines are
//    our own words.
//  - Every suggested link starts as unconfirmed. A person confirms it.
//  - Links are stored per standard edition, because the 2026 edition
//    restructures some clauses (for example 6.1).

export type IssueArea = 'receiving' | 'production' | 'customer_service' | 'supplier' | 'other'
export type IssueStatus = 'new' | 'in_progress' | 'resolved' | 'closed'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export const AREAS: { value: IssueArea; label: string }[] = [
  { value: 'receiving', label: 'Receiving goods' },
  { value: 'production', label: 'Production' },
  { value: 'customer_service', label: 'Customer service' },
  { value: 'supplier', label: 'A supplier' },
  { value: 'other', label: 'Somewhere else' },
]

export const AREA_LABEL: Record<IssueArea, string> = Object.fromEntries(
  AREAS.map((a) => [a.value, a.label])
) as Record<IssueArea, string>

export const STATUS_LABEL: Record<IssueStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Waiting to be checked',
  closed: 'Closed',
}

export const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const EDITION = '2015' // edition the fixed table below refers to

/** "ISS-0042" — the number is per company. */
export function issueCode(no: number): string {
  return `ISS-${String(no).padStart(4, '0')}`
}

/** First line of what was written, shortened for lists. */
export function makeTitle(text: string): string {
  const first = text.trim().split(/\r?\n/)[0]?.trim() ?? ''
  if (first.length <= 80) return first
  const cut = first.slice(0, 80)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export type ClauseSuggestion = { clause: string; why: string }

/**
 * Suggested ISO 9001 clause links for a new problem report.
 * A fixed table, our own wording, clause numbers only.
 */
export function suggestClauses(area: IssueArea): ClauseSuggestion[] {
  const out: ClauseSuggestion[] = [
    { clause: '8.7', why: 'Something did not meet a requirement. How you handled it is a record.' },
  ]
  if (area === 'customer_service') {
    out.push({ clause: '9.1.2', why: 'A customer is unhappy. Complaints show how satisfied customers are.' })
    out.push({ clause: '8.2.1', why: 'Customer feedback and complaints are part of talking with customers.' })
  }
  if (area === 'supplier' || area === 'receiving') {
    out.push({ clause: '8.4', why: 'The problem may come from something a supplier provided.' })
  }
  if (area === 'production') {
    out.push({ clause: '8.5.1', why: 'The problem happened while making the product or delivering the service.' })
  }
  return out
}

/** Added when a problem is turned into a corrective action. */
export const CAPA_CLAUSE: ClauseSuggestion = {
  clause: '10.2',
  why: 'A corrective action responds to a problem and checks it does not return.',
}

export type IssueForRules = {
  status: IssueStatus
  owner_id: string | null
  action_taken: string | null
  result_check: string | null
}

export type Transition = { to: IssueStatus; ok: boolean; reason?: string }

/** Which steps are allowed from the current state, and what is still missing. */
export function nextSteps(issue: IssueForRules): Transition[] {
  const has = (s: string | null) => !!s && s.trim().length > 0
  switch (issue.status) {
    case 'new':
      return [{ to: 'in_progress', ok: !!issue.owner_id, reason: issue.owner_id ? undefined : 'Choose an owner first.' }]
    case 'in_progress':
      return [{ to: 'resolved', ok: has(issue.action_taken), reason: has(issue.action_taken) ? undefined : 'Write what was done first.' }]
    case 'resolved':
      return [
        { to: 'closed', ok: has(issue.result_check), reason: has(issue.result_check) ? undefined : 'Write how you checked the result first.' },
        { to: 'in_progress', ok: true },
      ]
    case 'closed':
      return [{ to: 'in_progress', ok: true }]
  }
}

const ALLOWED_PHOTO = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export function checkPhoto(file: { type: string; size: number }): string | null {
  if (!ALLOWED_PHOTO.includes(file.type)) return 'Use a JPG, PNG or WebP photo.'
  if (file.size > MAX_PHOTO_BYTES) return 'The photo is larger than 5 MB.'
  return null
}

/** A safe file name for storage. */
export function safeFileName(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
  return cleaned.slice(-60) || 'photo'
}
