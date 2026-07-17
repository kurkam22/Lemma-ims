// Readiness scoring — deliberately honest.
//
// A readiness number that counts documents is exactly the "false compliance"
// this platform exists to prevent: a folder full of unapproved drafts with no
// evidence behind them is not readiness. So a requirement earns credit across
// several dimensions, and a document alone can never reach full marks.
//
// This is OUR estimate. It is not an ISO score and no certification body
// recognises it — always display READINESS_DISCLAIMER next to any figure.

export const READINESS_DISCLAIMER =
  'Estimated readiness based on your answers, documents and evidence. This is Lemma’s own indicator — not an ISO score and not a certification-body result.'

export type RequirementState = {
  /** Requirement judged not applicable (with a recorded justification). */
  notApplicable?: boolean
  /** The company answered the questions behind this requirement. */
  answered?: boolean
  /** A document exists (any status). */
  documentExists?: boolean
  /** The document has been through review and is approved. */
  documentApproved?: boolean
  /** Supporting evidence/records are attached. */
  evidenceProvided?: boolean
  /** Evidence has been verified (not just uploaded). */
  evidenceVerified?: boolean
  /** Covered by a completed internal audit. */
  audited?: boolean
  /** Audit raised a finding that is still open. */
  openFinding?: boolean
  /** Any corrective action for this requirement is past its due date. */
  overdueAction?: boolean
}

// Weights sum to 100 for an applicable requirement.
const W = {
  answered: 15, // you told us how you do it
  documentExists: 15, // it is written down
  documentApproved: 20, // someone with authority approved it
  evidenceProvided: 20, // there is proof it happens
  evidenceVerified: 15, // the proof was checked
  audited: 15, // you checked it yourself
} as const

const PENALTY = {
  openFinding: 15, // a known problem, not yet closed
  overdueAction: 10, // a fix is late
} as const

/** Score one requirement 0–100. Not-applicable requirements return null (excluded from the average). */
export function scoreRequirement(s: RequirementState): number | null {
  if (s.notApplicable) return null
  let score = 0
  if (s.answered) score += W.answered
  if (s.documentExists) score += W.documentExists
  if (s.documentApproved) score += W.documentApproved
  if (s.evidenceProvided) score += W.evidenceProvided
  if (s.evidenceVerified) score += W.evidenceVerified
  if (s.audited) score += W.audited
  if (s.openFinding) score -= PENALTY.openFinding
  if (s.overdueAction) score -= PENALTY.overdueAction
  return Math.max(0, Math.min(100, score))
}

/** Average across applicable requirements only — exclusions never inflate or deflate the score. */
export function overallReadiness(states: RequirementState[]): number {
  const scores = states.map(scoreRequirement).filter((n): n is number => n !== null)
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

/** Plain-language explanation of what is holding a requirement back. */
export function whatIsMissing(s: RequirementState): string[] {
  if (s.notApplicable) return []
  const gaps: string[] = []
  if (!s.answered) gaps.push('Tell us how you do this')
  if (!s.documentExists) gaps.push('Write it down (or upload what you have)')
  else if (!s.documentApproved) gaps.push('Get the document approved')
  if (!s.evidenceProvided) gaps.push('Add proof that it actually happens')
  else if (!s.evidenceVerified) gaps.push('Have the proof checked')
  if (!s.audited) gaps.push('Check it in an internal audit')
  if (s.openFinding) gaps.push('Close the open audit finding')
  if (s.overdueAction) gaps.push('An action is overdue')
  return gaps
}

/** Honest reading of a score — never implies certification. */
export function readinessMessage(pct: number): string {
  if (pct >= 85) return 'Strong. Most requirements are documented, approved and evidenced.'
  if (pct >= 60) return 'You’re past halfway. Focus on evidence and approvals next.'
  if (pct >= 35) return 'Good start. Documents exist — now show they’re real.'
  return 'Early days. Answer the setup questions and start with your first documents.'
}
