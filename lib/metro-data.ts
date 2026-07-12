// Compliance Metro Map — data model.
// Each ISO requirement clause is a STATION on one of the four PDCA lines.
// Documents / evidence / audits / CAPAs are branch STOPS hanging off a station.
// Status shapes: done = filled, progress = half-filled, missing = outlined.

export type MetroStatus = 'done' | 'progress' | 'missing'
export type MetroPhase = 'plan' | 'do' | 'check' | 'act'
export type StopKind = 'document' | 'evidence' | 'audit' | 'capa'

export type MetroStop = {
  kind: StopKind
  label: string
  status: MetroStatus
}

export type MetroClause = {
  clause: string // e.g. "7"
  title: string // plain-language station name
  phase: MetroPhase
  status: MetroStatus
  requirement?: string // plain-language requirement (for the trace panel)
  answer?: string // the company's answer (for the trace panel)
  stops?: MetroStop[]
}

export const PHASE_META: Record<
  MetroPhase,
  { label: string; color: string; soft: string }
> = {
  plan: { label: 'PLAN', color: '#2563eb', soft: '#dbeafe' },
  do: { label: 'DO', color: '#0d9488', soft: '#ccfbf1' },
  check: { label: 'CHECK', color: '#d97706', soft: '#fef3c7' },
  act: { label: 'ACT', color: '#7c3aed', soft: '#ede9fe' },
}

export const STOP_LETTERS: Record<StopKind, string> = {
  document: 'D',
  evidence: 'E',
  audit: 'A',
  capa: 'C',
}

export const STATUS_COLORS: Record<MetroStatus, string> = {
  done: '#059669',
  progress: '#d97706',
  missing: '#dc2626',
}

// Demo dataset — consistent with the ABC Manufacturing sample story
// (Plan 90% · Do 71% · Check 48% · Act 25%, readiness 62%).
export const DEMO_METRO: MetroClause[] = [
  {
    clause: '4',
    title: 'Context',
    phase: 'plan',
    status: 'done',
    requirement: 'Understand your company, its issues, interested parties and scope.',
    answer: 'Profile, scope and process map completed during setup.',
  },
  {
    clause: '5',
    title: 'Leadership',
    phase: 'plan',
    status: 'done',
    requirement: 'Management commitment, a policy, and assigned responsibilities.',
    answer: 'Quality policy approved; responsibilities assigned in Team & sites.',
  },
  {
    clause: '6',
    title: 'Planning',
    phase: 'plan',
    status: 'progress',
    requirement: 'Quality objectives must be measurable.',
    answer: 'We aim to improve quality and reduce complaints.',
    stops: [
      { kind: 'document', label: 'Objectives register', status: 'progress' },
      { kind: 'evidence', label: 'KPI tracking', status: 'missing' },
      { kind: 'audit', label: 'Not yet audited', status: 'progress' },
      { kind: 'capa', label: 'Add measurable KPIs', status: 'progress' },
    ],
  },
  {
    clause: '7',
    title: 'Support',
    phase: 'do',
    status: 'progress',
    requirement: 'Competence — staff must be competent for their roles.',
    answer: 'We train operators and keep skill records.',
    stops: [
      { kind: 'document', label: 'Competence procedure', status: 'done' },
      { kind: 'evidence', label: 'Training records', status: 'missing' },
      { kind: 'audit', label: 'Not yet audited', status: 'progress' },
      { kind: 'capa', label: 'Upload training records', status: 'missing' },
    ],
  },
  {
    clause: '8',
    title: 'Operation',
    phase: 'do',
    status: 'progress',
    requirement: 'Control of external providers (suppliers).',
    answer: 'We approve and re-evaluate key suppliers yearly.',
    stops: [
      { kind: 'document', label: 'Supplier procedure', status: 'done' },
      { kind: 'evidence', label: 'Evaluation record', status: 'missing' },
      { kind: 'audit', label: 'Minor finding', status: 'progress' },
      { kind: 'capa', label: 'Supplier evaluation record', status: 'progress' },
    ],
  },
  {
    clause: '9',
    title: 'Evaluation',
    phase: 'check',
    status: 'progress',
    requirement: 'Internal audit at planned intervals.',
    answer: 'We plan to audit twice a year.',
    stops: [
      { kind: 'document', label: 'Audit procedure', status: 'done' },
      { kind: 'evidence', label: 'Audit report', status: 'progress' },
      { kind: 'audit', label: 'First audit pending', status: 'progress' },
      { kind: 'capa', label: 'Audit plan needed', status: 'missing' },
    ],
  },
  {
    clause: '10',
    title: 'Improvement',
    phase: 'act',
    status: 'missing',
    requirement: 'Nonconformities handled with corrective action to the root cause.',
    answer: '3 corrective actions are open; one is overdue.',
    stops: [
      { kind: 'document', label: 'CAPA procedure', status: 'done' },
      { kind: 'evidence', label: 'Closed CAPA records', status: 'missing' },
      { kind: 'audit', label: 'Not yet audited', status: 'missing' },
      { kind: 'capa', label: 'Close overdue complaint CAPA', status: 'missing' },
    ],
  },
]
