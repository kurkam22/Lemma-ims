// The Requirements board: one tile for each requirement (clause) in the list
// the Gap assessment page already uses, coloured by how complete its trail is.
// The rules are Lemma's own indicator, not an ISO result and not an auditor's
// finding, so the words are "ready" and "needs work", never "conforming".

import type { MessageKey } from '@/lib/i18n'

export type ReqState = 'ready' | 'partly' | 'needs' | 'na' | 'notstarted'
export type DocState = 'approved' | 'in_review' | 'draft' | 'missing'

export const STATE_KEY: Record<ReqState, MessageKey> = {
  ready: 'req.state.ready',
  partly: 'req.state.partly',
  needs: 'req.state.needs',
  na: 'req.state.na',
  notstarted: 'req.state.notstarted',
}

export const PART_KEY: Record<string, MessageKey> = {
  '4': 'req.part.4',
  '5': 'req.part.5',
  '6': 'req.part.6',
  '7': 'req.part.7',
  '8': 'req.part.8',
  '9': 'req.part.9',
  '10': 'req.part.10',
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
export function nextStep(gap: string, doc: DocState, evidenceCount: number): { labelKey: MessageKey; href: string } | null {
  if (gap === 'not_applicable') return null
  if (gap === 'gap') return { labelKey: 'req.next.gap', href: '/dashboard/gap-assessment' }
  const answered = gap === 'compliant' || gap === 'user_confirmed'
  if (!answered) return { labelKey: 'req.next.answer', href: '/dashboard/gap-assessment' }
  if (doc === 'missing') return { labelKey: 'req.next.write', href: '/dashboard/documents/generator' }
  if (doc !== 'approved') return { labelKey: 'req.next.approve', href: '/dashboard/documents/centre' }
  if (evidenceCount === 0) return { labelKey: 'req.next.evidence', href: '/dashboard/evidence' }
  return null
}

export function summarize(states: ReqState[]): Record<ReqState, number> {
  const out: Record<ReqState, number> = { ready: 0, partly: 0, needs: 0, na: 0, notstarted: 0 }
  for (const s of states) out[s] += 1
  return out
}
