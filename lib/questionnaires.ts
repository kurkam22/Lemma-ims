// Per-document questionnaires. Answers are authoritative input for the AI:
// anything the client skips is rendered as [TO CONFIRM] in the draft.
// Question ids are stable — they become part of each document's provenance.

export type Question = {
  id: string
  label: string
  hint?: string
  kind: 'text' | 'textarea'
  placeholder?: string
}

export const QUESTIONNAIRES: Record<string, Question[]> = {
  'IMS Policy': [
    { id: 'commitments', kind: 'textarea', label: 'Your 3–5 main commitments', hint: 'e.g. customer satisfaction, on-time delivery, fewer defects, legal compliance, staff safety', placeholder: 'One per line' },
    { id: 'approver', kind: 'text', label: 'Who approves and signs the policy?', placeholder: 'e.g. General Director Kim Minsoo' },
    { id: 'communication', kind: 'text', label: 'How is the policy shared with staff?', placeholder: 'e.g. notice board, onboarding, quarterly all-hands' },
    { id: 'review_cycle', kind: 'text', label: 'How often is the policy reviewed?', placeholder: 'e.g. yearly at management review' },
  ],
  'Quality procedure': [
    { id: 'doc_owner', kind: 'text', label: 'Who owns and approves documents?', placeholder: 'e.g. QMS manager drafts, Director approves' },
    { id: 'storage', kind: 'text', label: 'Where are official documents kept?', placeholder: 'e.g. shared drive /Quality, printed master file in office' },
    { id: 'change_process', kind: 'textarea', label: 'What happens when a document must change?', placeholder: 'Who requests, who reviews, how old versions are withdrawn' },
    { id: 'records_retention', kind: 'text', label: 'How long are records kept?', placeholder: 'e.g. 3 years, contracts 5 years' },
  ],
  'Risk register': [
    { id: 'main_risks', kind: 'textarea', label: 'The main things that can go wrong in your work', hint: 'Think per process: supply delays, machine breakdown, staff turnover, defective materials…', placeholder: 'One risk per line' },
    { id: 'opportunities', kind: 'textarea', label: 'Opportunities you want to pursue', placeholder: 'e.g. new export market, automation of packing line' },
    { id: 'scoring', kind: 'text', label: 'How do you rate risks?', hint: 'If unsure, leave empty — we default to Likelihood × Impact, 1–3 scale', placeholder: 'e.g. 1–3 likelihood × 1–3 impact' },
    { id: 'owners', kind: 'text', label: 'Who is responsible for managing risks?', placeholder: 'e.g. each process owner, reviewed by QMS manager' },
  ],
  'Supplier evaluation procedure': [
    { id: 'criteria', kind: 'textarea', label: 'What matters when you choose a supplier?', placeholder: 'e.g. quality of samples, price, delivery reliability, certificates' },
    { id: 'key_suppliers', kind: 'textarea', label: 'Your most critical suppliers (name + what they supply)', placeholder: 'One per line' },
    { id: 'reeval', kind: 'text', label: 'How often do you re-check suppliers?', placeholder: 'e.g. yearly, or after any serious problem' },
    { id: 'failure_action', kind: 'text', label: 'What happens if a supplier fails evaluation?', placeholder: 'e.g. corrective request, then replacement' },
  ],
  'CAPA procedure': [
    { id: 'sources', kind: 'text', label: 'Where do problems usually surface?', placeholder: 'e.g. customer complaints, internal checks, audits' },
    { id: 'who_records', kind: 'text', label: 'Who records a problem when found?', placeholder: 'e.g. any employee reports to shift lead' },
    { id: 'root_cause', kind: 'text', label: 'How do you find the root cause?', hint: 'If unsure, leave empty — we default to 5-Why analysis', placeholder: 'e.g. 5-Why with the team involved' },
    { id: 'verify', kind: 'text', label: 'How do you confirm a fix actually worked?', placeholder: 'e.g. re-check after 30 days, monitor complaint rate' },
  ],
  'Internal audit procedure': [
    { id: 'frequency', kind: 'text', label: 'How often will you audit yourselves?', placeholder: 'e.g. full system once a year, production twice' },
    { id: 'auditors', kind: 'text', label: 'Who will perform internal audits?', hint: 'Auditors must not audit their own work', placeholder: 'e.g. QMS manager audits production; office lead audits QMS' },
    { id: 'reporting', kind: 'text', label: 'Who receives audit results?', placeholder: 'e.g. Director and process owners' },
    { id: 'followup', kind: 'text', label: 'What happens with findings?', placeholder: 'e.g. each finding becomes a corrective action with a deadline' },
  ],
  'Training procedure': [
    { id: 'needs', kind: 'text', label: 'How do you decide who needs training?', placeholder: 'e.g. role requirements, new equipment, audit findings' },
    { id: 'induction', kind: 'textarea', label: 'What does a new employee learn in the first weeks?', placeholder: 'e.g. safety briefing, quality policy, their procedures' },
    { id: 'records', kind: 'text', label: 'How do you record completed training?', placeholder: 'e.g. signed attendance sheet, certificate copies in HR folder' },
    { id: 'effectiveness', kind: 'text', label: 'How do you check training worked?', placeholder: 'e.g. supervisor observation, short quiz' },
  ],
  'Management review procedure': [
    { id: 'frequency', kind: 'text', label: 'How often does management review the system?', placeholder: 'e.g. every 6 months' },
    { id: 'attendees', kind: 'text', label: 'Who attends the review?', placeholder: 'e.g. Director, QMS manager, department heads' },
    { id: 'inputs_extra', kind: 'textarea', label: 'Anything specific your reviews should always cover?', hint: 'Standard inputs (audits, complaints, objectives, resources) are included automatically', placeholder: 'e.g. key customer feedback, seasonal capacity' },
    { id: 'minutes_owner', kind: 'text', label: 'Who writes and keeps the minutes?', placeholder: 'e.g. QMS manager' },
  ],
  'Competence matrix': [
    { id: 'roles', kind: 'textarea', label: 'The roles in your company', placeholder: 'One per line: e.g. Operator, Shift lead, QC inspector…' },
    { id: 'skills', kind: 'textarea', label: 'Key skills or qualifications per role (if known)', placeholder: 'e.g. Operator — machine safety card; QC — measurement training' },
    { id: 'levels', kind: 'text', label: 'How do you grade competence?', hint: 'If unsure, leave empty — we default to Trainee / Competent / Expert', placeholder: 'e.g. 1–3 levels' },
  ],
  'Process card': [
    { id: 'process_name', kind: 'text', label: 'Which process is this card for?', placeholder: 'e.g. Order handling, Production, Dispatch' },
    { id: 'owner', kind: 'text', label: 'Who owns this process?', placeholder: 'e.g. Production manager' },
    { id: 'steps', kind: 'textarea', label: 'The main steps, in order', placeholder: 'One per line' },
    { id: 'kpis', kind: 'text', label: 'How do you measure this process?', placeholder: 'e.g. % on-time, defect rate' },
    { id: 'records', kind: 'text', label: 'What records does it produce?', placeholder: 'e.g. order form, inspection log' },
  ],
  'Approved supplier list': [
    { id: 'suppliers', kind: 'textarea', label: 'Your current suppliers (name — product/service — critical or not)', placeholder: 'One per line' },
    { id: 'certificates', kind: 'text', label: 'Do any suppliers hold certifications you track?', placeholder: 'e.g. two have ISO 9001, one HACCP' },
  ],
}

// Rough server-side limits mirrored client-side: keep answers focused.
export const MAX_ANSWER_CHARS = 600
export const MAX_TOTAL_ANSWER_CHARS = 6000
