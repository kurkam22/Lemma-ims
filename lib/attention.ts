// "Needs your attention" — turns the company's own records into a short,
// prioritised to-do list.
//
// Honesty rules baked in (see platform rules 1, 3, 5, 6):
//  - Every item comes from a real record. Nothing is invented.
//  - Dates come from the company's own plans (audit dates, CAPA due dates,
//    certificate expiry). We never present a company's own frequency as an
//    ISO demand.
//  - No ISO clause text here. Plain language first.
//
// This file is pure (no database, no React) so it can be tested on its own.

import { formatDateLocale, translate, translateCount, type Locale } from '@/lib/i18n'

export type Urgency = 'overdue' | 'today' | 'soon' | 'upcoming' | 'open'

export type AttentionKind =
  | 'capa'
  | 'audit'
  | 'supplier'
  | 'training'
  | 'risk'
  | 'reminder'
  | 'evidence'
  | 'document'
  | 'issue'

export type AttentionItem = {
  id: string
  kind: AttentionKind
  title: string
  /** One short line: who / what / why. */
  detail: string
  /** ISO date (YYYY-MM-DD) or null when the item has no date. */
  due: string | null
  urgency: Urgency
  /** Days until due (negative = overdue). null when there is no date. */
  daysLeft: number | null
  href: string
  actionLabel: string
}

// ---- input rows (only the columns we need) -------------------------------

export type CapaRow = {
  id: string
  description: string | null
  severity: string | null
  status: string
  due_date: string | null
  responsible_id: string | null
}
export type AuditRow = {
  id: string
  title: string | null
  department: string
  scheduled_date: string | null
  status: string
}
export type SupplierRow = {
  id: string
  name: string
  cert_expiry: string | null
  approval_status: string
}
export type TrainingRow = {
  id: string
  kind: string
  module: string
  employee_name: string | null
  scheduled_month: string | null
  result: string | null
  status: string
}
export type RiskRow = {
  id: string
  status: string
  kind: string
  treatment: string | null
  review_date: string | null
}
export type ReminderRow = {
  id: string
  title: string
  kind: string
  due_date: string
  status: string
}
export type EvidenceRow = {
  id: string
  status: string
  expiry_date: string | null
}
export type DocumentRow = {
  id: string
  status: string
}
export type ExternalAuditRow = {
  id: string
  kind: 'initial' | 'surveillance' | 'recertification'
  planned_date: string
  status: string
}
export type CertificateRow = {
  expires_on: string
}
export type IssueRow = {
  id: string
  issue_no: number
  title: string
  status: string
  owner_id: string | null
  due_date: string | null
  created_at: string
}

export type AttentionInput = {
  today: Date
  capas: CapaRow[]
  audits: AuditRow[]
  suppliers: SupplierRow[]
  trainings: TrainingRow[]
  risks: RiskRow[]
  reminders: ReminderRow[]
  evidence: EvidenceRow[]
  documents: DocumentRow[]
  /** Reported problems. Optional so older callers keep working. */
  issues?: IssueRow[]
  /** Audits by the certification body, and the certificate. Optional too. */
  externalAudits?: ExternalAuditRow[]
  certificate?: CertificateRow | null
  /** Language of the generated text. Defaults to English. */
  locale?: Locale
  /** user id -> display name, used for CAPA owners */
  userNames: Record<string, string>
}

// ---- date helpers --------------------------------------------------------

const MS_PER_DAY = 86_400_000

/** Whole days from today to `iso` (both treated as calendar days, no timezone drift). */
export function daysUntil(iso: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return null
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - now) / MS_PER_DAY)
}

export function urgencyFor(days: number | null): Urgency {
  if (days === null) return 'open'
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'soon'
  return 'upcoming'
}

/** "Overdue by 3 days", "Due today", "Due in 5 days", "Due 12 Oct 2026" (or the Korean equivalents). */
export function dueLabel(days: number | null, iso: string | null, locale: Locale = 'en'): string {
  if (days === null || !iso) return ''
  if (days < 0) return translateCount(locale, 'due.overdue', -days)
  if (days === 0) return translate(locale, 'due.today')
  if (days === 1) return translate(locale, 'due.tomorrow')
  if (days <= 14) return translate(locale, 'due.inDays', { count: days })
  return translate(locale, 'due.on', { date: formatDate(iso, locale) })
}

/** Always includes the year, so "22 Jun" can never be ambiguous. */
export function formatDate(iso: string, locale: Locale = 'en'): string {
  return formatDateLocale(iso, locale)
}

const URGENCY_RANK: Record<Urgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  open: 3, // undated but needs action — above "upcoming" so it is not buried
  upcoming: 4,
}

// Only show dated items when they are overdue or due within this many days.
const WINDOW_DAYS = 30

// ---- main ----------------------------------------------------------------

export function buildAttention(input: AttentionInput): AttentionItem[] {
  const { today } = input
  const locale: Locale = input.locale ?? 'en'
  const tr = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(locale, key, params)
  const fd = (iso: string) => formatDate(iso, locale)
  const items: AttentionItem[] = []

  // Corrective actions (CAPA) that are still open
  for (const c of input.capas) {
    if (c.status !== 'open' && c.status !== 'in_progress') continue
    const days = c.due_date ? daysUntil(c.due_date, today) : null
    if (days !== null && days > WINDOW_DAYS) continue
    const owner = c.responsible_id ? input.userNames[c.responsible_id] : undefined
    const parts = [
      owner ? tr('att.owner', { name: owner }) : tr('att.noOwner'),
      days !== null && c.due_date ? tr('due.on', { date: fd(c.due_date) }) : tr('att.noDue'),
    ]
    items.push({
      id: `capa-${c.id}`,
      kind: 'capa',
      title: c.description?.trim() || tr('att.capa.fallback'),
      detail: parts.join(' · '),
      due: c.due_date,
      urgency: urgencyFor(days),
      daysLeft: days,
      href: '/dashboard/capa',
      actionLabel: tr('att.act.openAction'),
    })
  }

  // Problems reported by staff
  for (const i of input.issues ?? []) {
    if (i.status === 'closed') continue
    const code = `ISS-${String(i.issue_no).padStart(4, '0')}`
    const owner = i.owner_id ? input.userNames[i.owner_id] : undefined
    if (i.status === 'resolved') {
      items.push({
        id: `issue-${i.id}`,
        kind: 'issue',
        title: tr('att.issue.title', { code, title: i.title }),
        detail: tr('att.issue.resolved'),
        due: null,
        urgency: 'open',
        daysLeft: null,
        href: '/dashboard/issues',
        actionLabel: tr('att.act.checkResult'),
      })
      continue
    }
    const days = i.due_date ? daysUntil(i.due_date, today) : null
    if (days !== null && days > WINDOW_DAYS) continue
    const ageDays = -(daysUntil(i.created_at, today) ?? 0)
    if (!i.owner_id) {
      items.push({
        id: `issue-${i.id}`,
        kind: 'issue',
        title: tr('att.issue.title', { code, title: i.title }),
        detail: tr('att.issue.noOwner', { date: fd(i.created_at) }),
        due: i.due_date,
        urgency: days !== null ? urgencyFor(days) : ageDays >= 2 ? 'soon' : 'open',
        daysLeft: days,
        href: '/dashboard/issues',
        actionLabel: tr('att.act.chooseOwner'),
      })
    } else {
      items.push({
        id: `issue-${i.id}`,
        kind: 'issue',
        title: tr('att.issue.title', { code, title: i.title }),
        detail: [owner ? tr('att.owner', { name: owner }) : tr('att.ownerAssigned'), days !== null && i.due_date ? tr('due.on', { date: fd(i.due_date) }) : tr('att.noDue')].join(' · '),
        due: i.due_date,
        urgency: urgencyFor(days),
        daysLeft: days,
        href: '/dashboard/issues',
        actionLabel: tr('att.act.openProblem'),
      })
    }
  }

  // Audits by the certification body (needs preparation, so a longer window)
  const EXTERNAL_LABEL = {
    initial: tr('att.audit.initial'),
    surveillance: tr('att.audit.surveillance'),
    recertification: tr('att.audit.recertification'),
  } as const
  for (const a of input.externalAudits ?? []) {
    if (a.status !== 'planned') continue
    const days = daysUntil(a.planned_date, today)
    if (days === null || days > 45) continue
    items.push({
      id: `external-${a.id}`,
      kind: 'audit',
      title: EXTERNAL_LABEL[a.kind],
      detail: days < 0 ? tr('att.audit.overdue', { date: fd(a.planned_date) }) : tr('att.audit.by', { date: fd(a.planned_date) }),
      due: a.planned_date,
      urgency: urgencyFor(days),
      daysLeft: days,
      href: '/dashboard/certification',
      actionLabel: days < 0 ? tr('att.act.updateAudit') : tr('att.act.prepare'),
    })
  }

  // The certificate itself
  if (input.certificate) {
    const left = daysUntil(input.certificate.expires_on, today)
    if (left !== null && left >= 0 && left <= 180) {
      const hasPlan = (input.externalAudits ?? []).some((a) => a.kind === 'recertification' && a.status !== 'cancelled')
      items.push({
        id: 'certificate-ends',
        kind: 'audit',
        title: tr('att.cert.title', { date: fd(input.certificate.expires_on) }),
        detail: hasPlan ? tr('att.cert.planned') : tr('att.cert.noPlan'),
        due: input.certificate.expires_on,
        urgency: left <= 30 ? urgencyFor(left) : hasPlan ? 'upcoming' : 'soon',
        daysLeft: left,
        href: '/dashboard/certification',
        actionLabel: hasPlan ? tr('att.act.openClock') : tr('att.act.addAudit'),
      })
    }
  }

  // Internal audits that are planned or under way
  for (const a of input.audits) {
    if (a.status !== 'planned' && a.status !== 'in_progress') continue
    const days = a.scheduled_date ? daysUntil(a.scheduled_date, today) : null
    if (days !== null && days > WINDOW_DAYS) continue
    items.push({
      id: `audit-${a.id}`,
      kind: 'audit',
      title: tr('att.internal.title', { name: a.title?.trim() || a.department }),
      detail: days !== null && a.scheduled_date ? tr('att.internal.scheduled', { date: fd(a.scheduled_date) }) : tr('att.noDate'),
      due: a.scheduled_date,
      urgency: urgencyFor(days),
      daysLeft: days,
      href: '/dashboard/audits',
      actionLabel: tr('att.act.openAudit'),
    })
  }

  // Suppliers: certificate dates and waiting decisions
  for (const s of input.suppliers) {
    if (s.approval_status === 'rejected' || s.approval_status === 'suspended') continue
    if (s.cert_expiry) {
      const days = daysUntil(s.cert_expiry, today)
      if (days !== null && days <= WINDOW_DAYS) {
        items.push({
          id: `supplier-cert-${s.id}`,
          kind: 'supplier',
          title: tr(days < 0 ? 'att.supplier.expired' : 'att.supplier.soon', { name: s.name }),
          detail: tr(days < 0 ? 'att.supplier.expiredOn' : 'att.supplier.expiresOn', { date: fd(s.cert_expiry) }),
          due: s.cert_expiry,
          urgency: urgencyFor(days),
          daysLeft: days,
          href: '/dashboard/suppliers',
          actionLabel: tr('att.act.reviewSupplier'),
        })
      }
    }
    if (s.approval_status === 'pending') {
      items.push({
        id: `supplier-pending-${s.id}`,
        kind: 'supplier',
        title: tr('att.supplier.pending', { name: s.name }),
        detail: tr('att.supplier.pendingDetail'),
        due: null,
        urgency: 'open',
        daysLeft: null,
        href: '/dashboard/suppliers',
        actionLabel: tr('att.act.reviewSupplier'),
      })
    }
  }

  // Training: planned sessions whose month has arrived but nothing is recorded,
  // and failed results (grouped so a long list does not flood the screen).
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const dueTrainingPlans = input.trainings.filter(
    (t) => t.kind === 'plan' && t.status === 'planned' && !!t.scheduled_month && t.scheduled_month <= thisMonth
  )
  if (dueTrainingPlans.length > 0) {
    items.push({
      id: 'training-plans',
      kind: 'training',
      title: translateCount(locale, 'att.training.plans', dueTrainingPlans.length),
      detail: tr('att.training.plansDetail'),
      due: null,
      urgency: 'soon',
      daysLeft: null,
      href: '/dashboard/training',
      actionLabel: tr('att.act.reviewTraining'),
    })
  }
  const failedTraining = input.trainings.filter((t) => t.kind === 'record' && t.result === 'fail')
  if (failedTraining.length > 0) {
    items.push({
      id: 'training-failed',
      kind: 'training',
      title: translateCount(locale, 'att.training.failed', failedTraining.length),
      detail: tr('att.training.failedDetail'),
      due: null,
      urgency: 'open',
      daysLeft: null,
      href: '/dashboard/training',
      actionLabel: tr('att.act.reviewTraining'),
    })
  }

  // Risks: open risks without a chosen treatment, and overdue reviews
  const untreated = input.risks.filter((r) => r.kind === 'risk' && r.status === 'open' && !r.treatment)
  if (untreated.length > 0) {
    items.push({
      id: 'risks-untreated',
      kind: 'risk',
      title: translateCount(locale, 'att.risk.untreated', untreated.length),
      detail: tr('att.risk.untreatedDetail'),
      due: null,
      urgency: 'open',
      daysLeft: null,
      href: '/dashboard/risk',
      actionLabel: tr('att.act.addTreatment'),
    })
  }
  const overdueReviews = input.risks.filter((r) => {
    if (r.status !== 'open' || !r.review_date) return false
    const d = daysUntil(r.review_date, today)
    return d !== null && d < 0
  })
  if (overdueReviews.length > 0) {
    items.push({
      id: 'risks-review',
      kind: 'risk',
      title: translateCount(locale, 'att.risk.review', overdueReviews.length),
      detail: tr('att.risk.reviewDetail'),
      due: null,
      urgency: 'soon',
      daysLeft: null,
      href: '/dashboard/risk',
      actionLabel: tr('att.act.reviewRisks'),
    })
  }

  // Your own reminders (CAPA/audit reminders are skipped: those records already appear above)
  for (const r of input.reminders) {
    if (r.status !== 'open') continue
    if (r.kind === 'capa' || r.kind === 'audit') continue
    const days = daysUntil(r.due_date, today)
    if (days === null || days > 14) continue
    items.push({
      id: `reminder-${r.id}`,
      kind: 'reminder',
      title: r.title,
      detail: tr('due.on', { date: fd(r.due_date) }),
      due: r.due_date,
      urgency: urgencyFor(days),
      daysLeft: days,
      href: '/dashboard/reminders',
      actionLabel: tr('att.act.openReminder'),
    })
  }

  // Evidence that has expired or is about to
  const expiringEvidence = input.evidence.filter((e) => {
    if (e.status === 'archived') return false
    if (e.status === 'expired' || e.status === 'expiring') return true
    if (!e.expiry_date) return false
    const d = daysUntil(e.expiry_date, today)
    return d !== null && d <= WINDOW_DAYS
  })
  if (expiringEvidence.length > 0) {
    items.push({
      id: 'evidence-expiring',
      kind: 'evidence',
      title: translateCount(locale, 'att.evidence', expiringEvidence.length),
      detail: tr('att.evidenceDetail'),
      due: null,
      urgency: 'soon',
      daysLeft: null,
      href: '/dashboard/evidence',
      actionLabel: tr('att.act.updateEvidence'),
    })
  }

  // Documents waiting for someone to approve them
  const inReview = input.documents.filter((d) => d.status === 'in_review')
  if (inReview.length > 0) {
    items.push({
      id: 'documents-in-review',
      kind: 'document',
      title: translateCount(locale, 'att.docs', inReview.length),
      detail: tr('att.docsDetail'),
      due: null,
      urgency: 'open',
      daysLeft: null,
      href: '/dashboard/documents',
      actionLabel: tr('att.act.reviewDocuments'),
    })
  }

  items.sort((a, b) => {
    const r = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]
    if (r !== 0) return r
    if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft
    return a.title.localeCompare(b.title)
  })

  return items
}
