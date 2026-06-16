// Realistic sample data so the dashboard never shows an empty 0% state.
// Represents a believable mid-journey ISO 9001 company.

export const DEMO_COMPANY = {
  name: 'ABC Manufacturing Ltd.',
  standard: 'ISO 9001:2015',
  readinessPct: 62,
  documentsReady: 14,
  evidenceConfirmed: 9,
  openCapa: 3,
  nextActionLabel: 'Upload training records',
  nextActionDue: '2026-06-22',
  currentStage: 'check' as const,
}

export type JourneyStage = {
  key: 'plan' | 'do' | 'check' | 'act'
  label: string
  caption: string
  pct: number
  tasks: string[]
}

export const DEMO_JOURNEY: JourneyStage[] = [
  {
    key: 'plan',
    label: 'Plan',
    caption: 'Define your system',
    pct: 90,
    tasks: ['Company profile', 'Scope & processes', 'Risks & objectives'],
  },
  {
    key: 'do',
    label: 'Do',
    caption: 'Build & operate',
    pct: 71,
    tasks: ['14 documents prepared', 'Evidence collection', 'Staff training'],
  },
  {
    key: 'check',
    label: 'Check',
    caption: 'Verify & measure',
    pct: 48,
    tasks: ['AI compliance check', 'Internal audit due', 'Management review'],
  },
  {
    key: 'act',
    label: 'Act',
    caption: 'Improve',
    pct: 25,
    tasks: ['3 open CAPA', 'Improvement actions'],
  },
]

export type ChainStatus = 'done' | 'progress' | 'missing'

export type ComplianceChainRow = {
  clause: string
  requirement: string
  answer: string
  document: { label: string; status: ChainStatus }
  evidence: { label: string; status: ChainStatus }
  audit: { label: string; status: ChainStatus }
  capa: { label: string; status: ChainStatus } | null
}

export const DEMO_CHAIN: ComplianceChainRow[] = [
  {
    clause: '7.2',
    requirement: 'Competence — staff must be competent for their roles.',
    answer: 'We train operators and keep skill records.',
    document: { label: 'Competence procedure', status: 'done' },
    evidence: { label: 'Training records', status: 'missing' },
    audit: { label: 'Not yet audited', status: 'progress' },
    capa: { label: 'Upload training records', status: 'missing' },
  },
  {
    clause: '8.4',
    requirement: 'Control of external providers (suppliers).',
    answer: 'We approve and re-evaluate key suppliers yearly.',
    document: { label: 'Supplier procedure', status: 'done' },
    evidence: { label: 'Evaluation record', status: 'missing' },
    audit: { label: 'Minor finding', status: 'progress' },
    capa: { label: 'Supplier evaluation record', status: 'progress' },
  },
  {
    clause: '9.2',
    requirement: 'Internal audit at planned intervals.',
    answer: 'We plan to audit twice a year.',
    document: { label: 'Audit procedure', status: 'done' },
    evidence: { label: 'Audit report', status: 'progress' },
    audit: { label: 'Audit plan needed', status: 'missing' },
    capa: null,
  },
  {
    clause: '6.2',
    requirement: 'Quality objectives must be measurable.',
    answer: 'We aim to improve quality and reduce complaints.',
    document: { label: 'Objectives register', status: 'progress' },
    evidence: { label: 'KPI tracking', status: 'missing' },
    audit: { label: 'Not yet audited', status: 'progress' },
    capa: { label: 'Add measurable KPIs', status: 'progress' },
  },
]

export type AiInsight = {
  title: string
  detail: string
  severity: 'info' | 'warning' | 'danger'
  stage: 'plan' | 'do' | 'check' | 'act'
}

export const DEMO_AI_INSIGHTS: AiInsight[] = [
  {
    title: 'AI found 6 missing evidence items',
    detail: 'Several clauses have documents but no supporting proof yet.',
    severity: 'warning',
    stage: 'do',
  },
  {
    title: 'Quality objectives need measurable KPIs',
    detail: 'Clause 6.2 — "improve quality" is not measurable. Add targets.',
    severity: 'warning',
    stage: 'plan',
  },
  {
    title: 'Supplier evaluation record missing',
    detail: 'Clause 8.4 — procedure exists, but no evaluation record on file.',
    severity: 'warning',
    stage: 'do',
  },
  {
    title: 'Internal audit plan recommended',
    detail: 'Clause 9.2 — schedule your first internal audit before certification.',
    severity: 'info',
    stage: 'check',
  },
  {
    title: 'CAPA overdue: Customer complaint follow-up',
    detail: 'Corrective action past its due date. Review and close.',
    severity: 'danger',
    stage: 'act',
  },
]
