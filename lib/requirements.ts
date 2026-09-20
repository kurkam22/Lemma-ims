// The Requirements board: one tile for each requirement (clause) in the list
// the Gap assessment page already uses, coloured by how complete its trail is.
// The rules are Lemma's own indicator, not an ISO result and not an auditor's
// finding, so the words are "ready" and "needs work", never "conforming".

export type ReqState = 'ready' | 'partly' | 'needs' | 'na' | 'notstarted'
export type DocState = 'approved' | 'in_review' | 'draft' | 'missing'

export const STATE_LABEL: Record<ReqState, string> = {
  ready: 'Ready',
  partly: 'Partly ready',
  needs: 'Needs work',
  na: 'Not applicable',
  notstarted: 'Not started',
}

export const PART_NAME: Record<string, string> = {
  '4': 'Context',
  '5': 'Leadership',
  '6': 'Planning',
  '7': 'Support',
  '8': 'Operation',
  '9': 'Checking',
  '10': 'Improving',
}

export function partOf(clauseNumber: string): string {
  return clauseNumber.split('.')[0]
}

export function docState(status: string | null | undefined): DocState {
  if (status === 'approved') return 'approved'
  if (status === 'in_review') return 'in_review'
  if (status === 'draft') return 'draft'
  return 'missing'
}

/** gap = the status saved on the Gap assessment page (pending, compliant, gap, not_applicable, user_confirmed). */
export function deriveState(gap: string, doc: DocState, evidenceCount: number): ReqState {
  if (gap === 'not_applicable') return 'na'
  if (gap === 'gap') return 'needs'
  const answered = gap === 'compliant' || gap === 'user_confirmed'
  const hasEvidence = evidenceCount > 0
  if (answered && doc === 'approved' && hasEvidence) return 'ready'
  if (!answered && doc === 'missing' && !hasEvidence) return 'notstarted'
  return 'partly'
}

export type Trail = { answer: 'done' | 'gap' | 'todo'; document: DocState; evidence: number }

export function trailOf(gap: string, doc: DocState, evidenceCount: number): Trail {
  return {
    answer: gap === 'compliant' || gap === 'user_confirmed' ? 'done' : gap === 'gap' ? 'gap' : 'todo',
    document: doc,
    evidence: evidenceCount,
  }
}

/** The one thing to do next, in plain words, and where to do it. */
export function nextStep(gap: string, doc: DocState, evidenceCount: number): { label: string; href: string } | null {
  if (gap === 'not_applicable') return null
  if (gap === 'gap') return { label: 'Plan how to close this gap', href: '/dashboard/gap-assessment' }
  const answered = gap === 'compliant' || gap === 'user_confirmed'
  if (!answered) return { label: 'Say where you stand on this', href: '/dashboard/gap-assessment' }
  if (doc === 'missing') return { label: 'Write the document', href: '/dashboard/documents/generator' }
  if (doc !== 'approved') return { label: 'Get the document approved', href: '/dashboard/documents/centre' }
  if (evidenceCount === 0) return { label: 'Add proof that it happens', href: '/dashboard/evidence' }
  return null
}

export function summarize(states: ReqState[]): Record<ReqState, number> {
  const out: Record<ReqState, number> = { ready: 0, partly: 0, needs: 0, na: 0, notstarted: 0 }
  for (const s of states) out[s] += 1
  return out
}
