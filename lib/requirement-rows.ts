// Builds the rows of the Requirements board from the company's records.
// Used by the dashboard, the full Requirements page and the sample workspace,
// so all three always agree.

import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'
import { ISO_9001_CLAUSES_KO } from '@/lib/iso-clauses-ko'
import { deriveState, docState, type DocState } from '@/lib/requirements'
import type { Locale } from '@/lib/i18n'
import type { BoardRow } from '@/app/dashboard/_components/requirement-board'

export function buildBoardRows(opts: {
  gaps: Map<string, string>
  docs: Map<string, string>
  evidence: Map<string, number>
  locale?: Locale
}): BoardRow[] {
  const locale = opts.locale ?? 'en'
  return ISO_9001_CLAUSES.map((c) => {
    const gap = opts.gaps.get(c.number) ?? 'pending'
    const doc = docState(opts.docs.get(c.number))
    const evidenceCount = opts.evidence.get(c.number) ?? 0
    const ko = locale === 'ko' ? ISO_9001_CLAUSES_KO[c.number] : undefined
    return {
      number: c.number,
      plain: ko?.plain ?? c.plain,
      title: c.title,
      document: ko?.document ?? c.document,
      evidence: ko?.evidence ?? c.evidence,
      auditorAsks: ko?.auditorAsks ?? c.auditorAsks,
      gap,
      doc,
      evidenceCount,
      state: deriveState(gap, doc, evidenceCount),
    }
  })
}

/** Sample states for the fictional company (20 requirements, in list order). */
const SAMPLE: [string, DocState, number][] = [
  ['compliant', 'approved', 2], ['compliant', 'approved', 1], ['user_confirmed', 'approved', 3], ['compliant', 'in_review', 0],
  ['compliant', 'approved', 1], ['compliant', 'draft', 0], ['gap', 'missing', 0],
  ['compliant', 'approved', 2], ['user_confirmed', 'approved', 1], ['pending', 'missing', 0], ['not_applicable', 'missing', 0],
  ['compliant', 'approved', 1], ['compliant', 'approved', 0], ['gap', 'draft', 0], ['pending', 'missing', 0],
  ['compliant', 'approved', 2], ['compliant', 'in_review', 1], ['pending', 'missing', 0],
  ['gap', 'missing', 0], ['pending', 'missing', 0],
]

export function getDemoBoardRows(locale: Locale = 'en'): BoardRow[] {
  const gaps = new Map<string, string>()
  const docs = new Map<string, string>()
  const evidence = new Map<string, number>()
  ISO_9001_CLAUSES.forEach((c, i) => {
    const [gap, doc, ev] = SAMPLE[i] ?? ['pending', 'missing', 0]
    gaps.set(c.number, gap)
    if (doc !== 'missing') docs.set(c.number, doc)
    evidence.set(c.number, ev)
  })
  return buildBoardRows({ gaps, docs, evidence, locale })
}
