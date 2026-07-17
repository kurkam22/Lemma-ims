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
  'Customer satisfaction procedure': [
    { id: 'sources', kind: 'textarea', label: 'How do you find out what customers think of you?', hint: 'Complaints, repeat orders, returns, surveys, direct conversations — anything already happening counts', placeholder: 'One per line' },
    { id: 'frequency', kind: 'text', label: 'How often do you look at this information?', placeholder: 'e.g. complaints as they arrive; a summary every quarter' },
    { id: 'owner', kind: 'text', label: 'Who is responsible for watching customer satisfaction?', placeholder: 'e.g. Sales manager, reviewed by Director' },
    { id: 'action', kind: 'text', label: 'What happens when satisfaction drops?', placeholder: 'e.g. becomes a corrective action; raised at management review' },
  ],
  'Calibration & measuring equipment procedure': [
    { id: 'equipment', kind: 'textarea', label: 'Which equipment decides whether your work passes or fails?', hint: 'Scales, gauges, thermometers, testers — only the ones whose reading decides acceptance', placeholder: 'One per line, with location if useful' },
    { id: 'frequency', kind: 'text', label: 'How often is each calibrated or checked — and on what basis?', hint: 'ISO says “at specified intervals” — you set them (often from the maker’s advice or how heavily it is used).', placeholder: 'e.g. scales yearly by an external lab (maker’s advice); thermometers checked monthly in-house' },
    { id: 'who', kind: 'text', label: 'Who calibrates them?', placeholder: 'e.g. accredited external laboratory; internal check against a reference' },
    { id: 'identification', kind: 'text', label: 'How do you know an item is in date?', placeholder: 'e.g. calibration sticker with next-due date' },
    { id: 'if_wrong', kind: 'text', label: 'What do you do if equipment is found out of calibration?', hint: 'The standard expects you to consider work already done with it', placeholder: 'e.g. quarantine it, review recent output, inform customers if affected' },
  ],
  'Nonconforming output procedure': [
    { id: 'detection', kind: 'text', label: 'How is faulty work usually spotted?', placeholder: 'e.g. inspection before dispatch, operator check, customer complaint' },
    { id: 'segregation', kind: 'text', label: 'Where does faulty work go so it cannot be used by mistake?', placeholder: 'e.g. red quarantine area, labelled shelf, blocked in the system' },
    { id: 'decisions', kind: 'text', label: 'Who decides what happens to it — and what are the options?', hint: 'Typical options: rework, scrap, downgrade, or accept with permission', placeholder: 'e.g. Production manager decides: rework, scrap, or ask customer for concession' },
    { id: 'customer', kind: 'text', label: 'When do you tell the customer?', placeholder: 'e.g. always, if it already shipped or if we ask for a concession' },
    { id: 'recheck', kind: 'text', label: 'How do you confirm reworked items are now good?', placeholder: 'e.g. re-inspected against the same criteria and recorded' },
  ],
  'Interested parties register': [
    { id: 'parties', kind: 'textarea', label: 'Who has a stake in your quality?', hint: 'Customers, regulators, suppliers, staff, neighbours, your bank — anyone who affects you or is affected', placeholder: 'One per line' },
    { id: 'needs', kind: 'textarea', label: 'What does each of them expect from you?', placeholder: 'e.g. Customers — on-time delivery; Regulator — hygiene compliance' },
    { id: 'review', kind: 'text', label: 'How often do you revisit this list?', placeholder: 'e.g. yearly at management review' },
  ],

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
    { id: 'reeval', kind: 'text', label: 'How often will you re-check suppliers — and why that interval?', hint: 'ISO does not set a frequency. You choose it based on how much damage a bad supplier could do, and how they have performed before. Say the reason too — an auditor will ask.', placeholder: 'e.g. key suppliers yearly (they can stop production); others every 2 years' },
    { id: 'failure_action', kind: 'text', label: 'What happens if a supplier fails evaluation?', placeholder: 'e.g. corrective request, then replacement' },
  ],
  'CAPA procedure': [
    { id: 'sources', kind: 'text', label: 'Where do problems usually surface?', placeholder: 'e.g. customer complaints, internal checks, audits' },
    { id: 'who_records', kind: 'text', label: 'Who records a problem when found?', placeholder: 'e.g. any employee reports to shift lead' },
    { id: 'root_cause', kind: 'text', label: 'How do you find the root cause?', hint: 'If unsure, leave empty — we default to 5-Why analysis', placeholder: 'e.g. 5-Why with the team involved' },
    { id: 'verify', kind: 'text', label: 'How do you confirm a fix actually worked?', placeholder: 'e.g. re-check after 30 days, monitor complaint rate' },
  ],
  'Internal audit procedure': [
    { id: 'frequency', kind: 'text', label: 'How often will you audit each area — and why?', hint: 'ISO asks for “planned intervals” you can justify: audit the important and problem-prone areas more often. There is no required number.', placeholder: 'e.g. production twice a year (highest risk), office once, after any major change' },
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
    { id: 'frequency', kind: 'text', label: 'How often will management review the system — and why that interval?', hint: 'ISO says “planned intervals”, not a fixed number. Most small companies choose yearly or twice yearly.', placeholder: 'e.g. yearly, plus after any big change' },
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
