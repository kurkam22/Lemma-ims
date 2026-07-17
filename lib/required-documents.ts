// Required documents per standard — plain-language, clause-referenced.
// Explanations are our own words; official ISO text is never reproduced.
//
// kind: 'maintain' = a living document you keep current and versioned
//       'retain'   = a record: frozen evidence of something that happened
// appliesIf: when set, the document only applies to companies matching that
//       condition — the standard permits requirements to be judged
//       not applicable, provided a justification is recorded.

export type DocKind = 'maintain' | 'retain'

/**
 * How strongly the standard actually asks for this item. The distinction
 * matters: ISO 9001 requires you to KEEP EVIDENCE of competence, but it never
 * asks for a "competence procedure". Presenting a helpful document as an ISO
 * demand is exactly the padding that makes tools untrustworthy.
 *
 *  'required-evidence'  — the standard says you must retain this record
 *  'required-document'  — the standard says this must be documented
 *  'recommended'        — not demanded, but auditors expect it and it makes the system work
 *  'optional'           — entirely the company's choice
 */
export type Obligation = 'required-evidence' | 'required-document' | 'recommended' | 'optional'

export const OBLIGATION_LABELS: Record<Obligation, { label: string; hint: string; tone: 'red' | 'blue' | 'grey' }> = {
  'required-evidence': {
    label: 'ISO requires this record',
    hint: 'The standard says you must keep evidence of this. An auditor will ask to see it.',
    tone: 'red',
  },
  'required-document': {
    label: 'ISO requires this in writing',
    hint: 'The standard says this must be documented.',
    tone: 'red',
  },
  recommended: {
    label: 'Recommended — not demanded by ISO',
    hint: 'The standard does not require this document, but it is the usual way to show you meet the requirement, and auditors expect to see how you do it.',
    tone: 'blue',
  },
  optional: {
    label: 'Your choice',
    hint: 'Useful, but entirely up to your company.',
    tone: 'grey',
  },
}

export type Applicability =
  | 'always'
  | 'if-design' // company designs/develops its products or services
  | 'if-measuring' // company uses measuring equipment for conformity
  | 'if-customer-property' // company handles customer-owned goods/data

export type RequiredDoc = {
  id: string
  title: string // plain-language name (what the user sees first)
  isoTitle?: string // the ISO-style term, shown small for learning
  clauseRef: string // reference only, e.g. "ISO 9001:2015 · 4.3"
  why: string // plain-language reason the document is needed
  mandatory: boolean
  /** What the standard actually demands — see Obligation. */
  obligation: Obligation
  kind: DocKind
  appliesIf?: Applicability
}

export type DocSet = {
  standardId: string
  standardLabel: string
  docs: RequiredDoc[]
}

export const APPLICABILITY_QUESTIONS: {
  id: Applicability
  question: string
  hint: string
}[] = [
  {
    id: 'if-design',
    question: 'Do you design or develop your own products or services?',
    hint: 'If you only make things to a customer’s drawing or a fixed recipe, answer no.',
  },
  {
    id: 'if-measuring',
    question: 'Do you use measuring equipment to decide if your work is acceptable?',
    hint: 'Scales, gauges, thermometers, test equipment — anything whose reading decides pass or fail.',
  },
  {
    id: 'if-customer-property',
    question: 'Do you hold anything belonging to your customers?',
    hint: 'Their materials, tools, packaging, or their personal data.',
  },
]

const ISO9001: DocSet = {
  standardId: 'iso-9001',
  standardLabel: 'ISO 9001 — Quality Management',
  docs: [
    // ---- Understanding your company (clause 4)
    { id: 'q-scope', title: 'What your system covers', isoTitle: 'Scope of the QMS', clauseRef: 'ISO 9001:2015 · 4.3', mandatory: true, obligation: 'required-document', kind: 'maintain', why: 'Says which products, services and sites are included — and what is left out, with a reason.' },
    { id: 'q-parties', title: 'Who matters to your business', isoTitle: 'Interested parties register', clauseRef: 'ISO 9001:2015 · 4.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Customers, regulators, suppliers, staff — who affects your quality, and what they expect from you.' },
    { id: 'q-processes', title: 'How your work flows', isoTitle: 'Processes and their interaction', clauseRef: 'ISO 9001:2015 · 4.4', mandatory: true, obligation: 'required-document', kind: 'maintain', why: 'Your main processes, how they connect, who owns each, and how you know they work.' },

    // ---- Leadership (clause 5)
    { id: 'q-policy', title: 'Your quality promise', isoTitle: 'Quality policy', clauseRef: 'ISO 9001:2015 · 5.2', mandatory: true, obligation: 'required-document', kind: 'maintain', why: 'Management’s written commitment to quality, shared with staff.' },
    { id: 'q-roles', title: 'Who is responsible for what', isoTitle: 'Roles & responsibilities', clauseRef: 'ISO 9001:2015 · 5.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Auditors ask staff what they are responsible for — this is where it is written down.' },

    // ---- Planning (clause 6)
    { id: 'q-risk', title: 'What could go wrong (and your chances)', isoTitle: 'Risks & opportunities', clauseRef: 'ISO 9001:2015 · 6.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The main risks to your quality and what you do about them — plus opportunities worth taking.' },
    { id: 'q-objectives', title: 'Your goals with numbers', isoTitle: 'Quality objectives & plans', clauseRef: 'ISO 9001:2015 · 6.2', mandatory: true, obligation: 'required-document', kind: 'maintain', why: 'Goals must be measurable, with an owner and a deadline — “improve quality” is not enough.' },
    { id: 'q-changes', title: 'How you handle changes', isoTitle: 'Planning of changes', clauseRef: 'ISO 9001:2015 · 6.3 / 8.5.6', mandatory: false, obligation: 'required-evidence', kind: 'retain', why: 'When you change how you work, you plan it rather than improvising — and keep a note of what changed and who approved it.' },

    // ---- Support (clause 7)
    { id: 'q-competence', title: 'Proof your people can do the job', isoTitle: 'Competence & training records', clauseRef: 'ISO 9001:2015 · 7.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'What each role needs to know, and evidence that your staff know it.' },
    { id: 'q-awareness', title: 'Staff know the policy and their part', isoTitle: 'Awareness records', clauseRef: 'ISO 9001:2015 · 7.3', mandatory: true, obligation: 'recommended', kind: 'retain', why: 'Auditors ask ordinary staff about the quality policy — this is how you show they were told.' },
    { id: 'q-calibration', title: 'Your measuring equipment is trustworthy', isoTitle: 'Monitoring & measuring resources', clauseRef: 'ISO 9001:2015 · 7.1.5', mandatory: true, obligation: 'required-evidence', kind: 'retain', appliesIf: 'if-measuring', why: 'If a scale, gauge or thermometer decides whether work passes, it must be calibrated and the certificates kept.' },
    { id: 'q-knowledge', title: 'Know-how you cannot afford to lose', isoTitle: 'Organizational knowledge', clauseRef: 'ISO 9001:2015 · 7.1.6', mandatory: false, obligation: 'recommended', kind: 'maintain', why: 'The experience that lives in people’s heads — captured so it survives someone leaving.' },
    { id: 'q-communication', title: 'Who tells whom, and when', isoTitle: 'Communication plan', clauseRef: 'ISO 9001:2015 · 7.4', mandatory: false, obligation: 'recommended', kind: 'maintain', why: 'How quality information moves inside the company and to customers.' },
    { id: 'q-doc-control', title: 'Keeping documents current', isoTitle: 'Control of documented information', clauseRef: 'ISO 9001:2015 · 7.5', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How documents get approved and updated, so nobody is working from an old copy.' },

    // ---- Operation (clause 8)
    { id: 'q-operations', title: 'How your main work is done', isoTitle: 'Operational procedures', clauseRef: 'ISO 9001:2015 · 8.1 / 8.5', mandatory: true, obligation: 'required-document', kind: 'maintain', why: 'The instructions your people actually follow — the heart of the system.' },
    { id: 'q-customer-req', title: 'Checking you can deliver before you promise', isoTitle: 'Review of customer requirements', clauseRef: 'ISO 9001:2015 · 8.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Before accepting an order, you confirm you can meet it — and keep a record of that check.' },
    { id: 'q-design', title: 'How you design new products', isoTitle: 'Design & development records', clauseRef: 'ISO 9001:2015 · 8.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', appliesIf: 'if-design', why: 'Inputs, reviews, checks and approvals for anything you design yourself.' },
    { id: 'q-suppliers', title: 'Choosing and checking suppliers', isoTitle: 'Supplier evaluation records', clauseRef: 'ISO 9001:2015 · 8.4', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'How you pick suppliers and re-check them, so what you buy does not break your quality.' },
    { id: 'q-customer-property', title: 'Looking after customers’ things', isoTitle: 'Customer property records', clauseRef: 'ISO 9001:2015 · 8.5.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', appliesIf: 'if-customer-property', why: 'If you hold customer materials, tools or data, you protect them — and report it if something goes wrong.' },
    { id: 'q-release', title: 'Proof it was checked before it left', isoTitle: 'Release records', clauseRef: 'ISO 9001:2015 · 8.6', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Evidence that each product or service was checked and approved, and by whom.' },
    { id: 'q-nonconforming', title: 'What you do with bad output', isoTitle: 'Control of nonconforming outputs', clauseRef: 'ISO 9001:2015 · 8.7', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Faulty work is separated, scrapped, reworked or accepted with permission — never shipped by accident.' },

    // ---- Checking (clause 9)
    { id: 'q-monitor', title: 'The numbers that show it works', isoTitle: 'Monitoring & measurement results', clauseRef: 'ISO 9001:2015 · 9.1.1', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Defect rates, on-time delivery, complaints — the data behind your objectives.' },
    { id: 'q-satisfaction', title: 'What your customers think of you', isoTitle: 'Customer satisfaction', clauseRef: 'ISO 9001:2015 · 9.1.2', mandatory: true, obligation: 'recommended', kind: 'retain', why: 'You must watch how customers perceive you — complaints, surveys, returns, repeat orders all count.' },
    { id: 'q-audit', title: 'Checking yourself before the auditor does', isoTitle: 'Internal audit programme & reports', clauseRef: 'ISO 9001:2015 · 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own audit of the system — auditors will not certify you without it.' },
    { id: 'q-review', title: 'Management looked and decided', isoTitle: 'Management review minutes', clauseRef: 'ISO 9001:2015 · 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Top management reviews results and makes decisions — recorded.' },

    // ---- Improving (clause 10)
    { id: 'q-nc', title: 'Problems, causes and fixes', isoTitle: 'Nonconformity & corrective action', clauseRef: 'ISO 9001:2015 · 10.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'What went wrong, why it really happened, the fix, and proof the fix worked.' },
  ],
}

const ISO14001: DocSet = {
  standardId: 'iso-14001',
  standardLabel: 'ISO 14001 — Environmental Management',
  docs: [
    { id: 'e-scope', title: 'Scope of the EMS', clauseRef: 'ISO 14001:2015 · 4.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Which activities and sites the environmental system covers.' },
    { id: 'e-policy', title: 'Environmental policy', clauseRef: 'ISO 14001:2015 · 5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Management’s commitment to protecting the environment and meeting legal duties.' },
    { id: 'e-aspects', title: 'Environmental aspects & impacts register', clauseRef: 'ISO 14001:2015 · 6.1.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How your activities affect the environment (waste, emissions, energy, water) and which matter most.' },
    { id: 'e-legal', title: 'Legal & other requirements register', clauseRef: 'ISO 14001:2015 · 6.1.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The environmental laws and permits that apply to you, tracked in one place.' },
    { id: 'e-objectives', title: 'Environmental objectives & plans', clauseRef: 'ISO 14001:2015 · 6.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Measurable environmental goals with owners and deadlines.' },
    { id: 'e-competence', title: 'Competence & awareness records', clauseRef: 'ISO 14001:2015 · 7.2–7.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Staff know their environmental duties and are trained for them.' },
    { id: 'e-opcontrol', title: 'Operational control procedures', clauseRef: 'ISO 14001:2015 · 8.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How you control the operations that could harm the environment.' },
    { id: 'e-emergency', title: 'Emergency preparedness & response plan', clauseRef: 'ISO 14001:2015 · 8.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'What you do if a spill, fire or other environmental emergency happens — and drills to prove it.' },
    { id: 'e-monitor', title: 'Monitoring & measurement records', clauseRef: 'ISO 14001:2015 · 9.1', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'The data (waste volumes, consumption, emissions) showing performance and compliance.' },
    { id: 'e-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 14001:2015 · 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own check of the environmental system before the external audit.' },
    { id: 'e-review', title: 'Management review minutes', clauseRef: 'ISO 14001:2015 · 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Leadership reviewed environmental performance and decided improvements.' },
    { id: 'e-nc', title: 'Nonconformity & corrective action records', clauseRef: 'ISO 14001:2015 · 10.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Environmental problems, root causes and fixes — recorded.' },
  ],
}

const ISO45001: DocSet = {
  standardId: 'iso-45001',
  standardLabel: 'ISO 45001 — Occupational Health & Safety',
  docs: [
    { id: 's-scope', title: 'Scope of the OH&S system', clauseRef: 'ISO 45001:2018 · 4.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Which workplaces and activities the safety system covers.' },
    { id: 's-policy', title: 'OH&S policy', clauseRef: 'ISO 45001:2018 · 5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Management’s commitment to safe, healthy workplaces.' },
    { id: 's-hazards', title: 'Hazard identification & risk assessment', clauseRef: 'ISO 45001:2018 · 6.1.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The dangers in your work, how serious they are, and the controls in place.' },
    { id: 's-legal', title: 'Legal requirements register', clauseRef: 'ISO 45001:2018 · 6.1.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The safety laws and rules that apply to you.' },
    { id: 's-objectives', title: 'OH&S objectives & plans', clauseRef: 'ISO 45001:2018 · 6.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Measurable safety goals (incidents down, training up) with owners.' },
    { id: 's-competence', title: 'Competence & training records', clauseRef: 'ISO 45001:2018 · 7.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Proof workers are trained for the risks of their job.' },
    { id: 's-participation', title: 'Worker consultation & participation records', clauseRef: 'ISO 45001:2018 · 5.4', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Evidence workers are consulted on safety — a 45001 speciality auditors check.' },
    { id: 's-opcontrol', title: 'Operational control procedures', clauseRef: 'ISO 45001:2018 · 8.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How dangerous work is controlled (permits, PPE, contractor rules).' },
    { id: 's-emergency', title: 'Emergency preparedness & response plan', clauseRef: 'ISO 45001:2018 · 8.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'What happens in an accident, fire or emergency — with drills.' },
    { id: 's-incident', title: 'Incident investigation records', clauseRef: 'ISO 45001:2018 · 10.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Accidents and near-misses investigated to the root cause.' },
    { id: 's-monitor', title: 'Monitoring & measurement records', clauseRef: 'ISO 45001:2018 · 9.1', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Safety performance data (incidents, inspections, exposure checks).' },
    { id: 's-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 45001:2018 · 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own safety-system check before certification.' },
    { id: 's-review', title: 'Management review minutes', clauseRef: 'ISO 45001:2018 · 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Leadership reviewed safety performance and acted.' },
  ],
}

const ISO22000: DocSet = {
  standardId: 'iso-22000',
  standardLabel: 'ISO 22000 — Food Safety',
  docs: [
    { id: 'f-scope', title: 'Scope of the FSMS', clauseRef: 'ISO 22000:2018 · 4.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Which products, processes and sites the food-safety system covers.' },
    { id: 'f-policy', title: 'Food safety policy', clauseRef: 'ISO 22000:2018 · 5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Management’s commitment to safe food.' },
    { id: 'f-team', title: 'Food safety team & roles', clauseRef: 'ISO 22000:2018 · 5.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The named team responsible for the HACCP study and the system.' },
    { id: 'f-prp', title: 'PRPs (prerequisite programmes)', clauseRef: 'ISO 22000:2018 · 8.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The basic hygiene foundations: cleaning, pest control, personal hygiene, maintenance.' },
    { id: 'f-product', title: 'Product descriptions & intended use', clauseRef: 'ISO 22000:2018 · 8.5.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'What the product is, its ingredients/allergens, and who will consume it.' },
    { id: 'f-flow', title: 'Process flow diagrams', clauseRef: 'ISO 22000:2018 · 8.5.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Every step from raw material to dispatch — the map the hazard analysis walks.' },
    { id: 'f-hazard', title: 'Hazard analysis', clauseRef: 'ISO 22000:2018 · 8.5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Biological, chemical and physical hazards at each step, and how serious they are.' },
    { id: 'f-ccp', title: 'CCP / OPRP plan (control measures)', clauseRef: 'ISO 22000:2018 · 8.5.4', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'The critical points where control is essential — limits, monitoring, corrections.' },
    { id: 'f-traceability', title: 'Traceability system & records', clauseRef: 'ISO 22000:2018 · 8.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'You can trace any batch one step back and one step forward.' },
    { id: 'f-recall', title: 'Withdrawal / recall procedure', clauseRef: 'ISO 22000:2018 · 8.9.5', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How you pull unsafe product from the market fast — tested with a mock recall.' },
    { id: 'f-monitor', title: 'Monitoring records (temperatures, checks)', clauseRef: 'ISO 22000:2018 · 8.5.4.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'The daily proof control points stay within limits.' },
    { id: 'f-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 22000:2018 · 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own food-safety check before the certifier arrives.' },
    { id: 'f-review', title: 'Management review minutes', clauseRef: 'ISO 22000:2018 · 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Leadership reviewed food-safety performance and decided actions.' },
  ],
}

const ISO27001: DocSet = {
  standardId: 'iso-27001',
  standardLabel: 'ISO/IEC 27001 — Information Security',
  docs: [
    { id: 'i-scope', title: 'Scope of the ISMS', clauseRef: 'ISO/IEC 27001:2022 · 4.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Which systems, data and locations the security system covers.' },
    { id: 'i-policy', title: 'Information security policy', clauseRef: 'ISO/IEC 27001:2022 · 5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Management’s commitment to protecting information.' },
    { id: 'i-risk-method', title: 'Risk assessment methodology', clauseRef: 'ISO/IEC 27001:2022 · 6.1.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How you identify and score security risks — consistently.' },
    { id: 'i-risk', title: 'Risk assessment & treatment plan', clauseRef: 'ISO/IEC 27001:2022 · 6.1.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Your actual risks and what you decided to do about each.' },
    { id: 'i-soa', title: 'Statement of Applicability (SoA)', clauseRef: 'ISO/IEC 27001:2022 · 6.1.3 d', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'The signature 27001 document: which Annex A controls apply, and why or why not.' },
    { id: 'i-objectives', title: 'Security objectives', clauseRef: 'ISO/IEC 27001:2022 · 6.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Measurable security goals with owners.' },
    { id: 'i-competence', title: 'Competence & awareness records', clauseRef: 'ISO/IEC 27001:2022 · 7.2–7.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Staff trained on security duties; awareness proven.' },
    { id: 'i-access', title: 'Access control & key operating procedures', clauseRef: 'ISO/IEC 27001:2022 · Annex A', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Who can access what, joiner/leaver process, backups, incident response.' },
    { id: 'i-incident', title: 'Security incident records', clauseRef: 'ISO/IEC 27001:2022 · Annex A 5.24–5.28', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Incidents logged, handled and learned from.' },
    { id: 'i-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO/IEC 27001:2022 · 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own ISMS check before certification.' },
    { id: 'i-review', title: 'Management review minutes', clauseRef: 'ISO/IEC 27001:2022 · 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Leadership reviewed security performance and decided actions.' },
    { id: 'i-nc', title: 'Nonconformity & corrective action records', clauseRef: 'ISO/IEC 27001:2022 · 10.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Security problems fixed at the root, with records.' },
  ],
}

const GENERIC: DocSet = {
  standardId: 'generic',
  standardLabel: 'Management system (Annex SL common structure)',
  docs: [
    { id: 'g-scope', title: 'Scope of the management system', clauseRef: 'clause 4.3', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Defines what the system covers.' },
    { id: 'g-policy', title: 'Policy', clauseRef: 'clause 5.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Management’s top-level commitment.' },
    { id: 'g-objectives', title: 'Objectives & plans', clauseRef: 'clause 6.2', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Measurable goals with owners and deadlines.' },
    { id: 'g-risk', title: 'Risk & opportunity register', clauseRef: 'clause 6.1', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Main risks and how you address them.' },
    { id: 'g-competence', title: 'Competence & training records', clauseRef: 'clause 7.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Proof people are capable for their roles.' },
    { id: 'g-doc', title: 'Document control procedure', clauseRef: 'clause 7.5', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'Documents approved, current, and controlled.' },
    { id: 'g-ops', title: 'Operational procedures', clauseRef: 'clause 8', mandatory: true, obligation: 'recommended', kind: 'maintain', why: 'How the core work is done and controlled.' },
    { id: 'g-monitor', title: 'Monitoring & measurement results', clauseRef: 'clause 9.1', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Performance data for the system.' },
    { id: 'g-audit', title: 'Internal audit programme & reports', clauseRef: 'clause 9.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Your own check before the external audit.' },
    { id: 'g-review', title: 'Management review minutes', clauseRef: 'clause 9.3', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Leadership reviewed and decided.' },
    { id: 'g-nc', title: 'Nonconformity & corrective action records', clauseRef: 'clause 10.2', mandatory: true, obligation: 'required-evidence', kind: 'retain', why: 'Problems fixed at the root, with records.' },
  ],
}

export const DOC_SETS: DocSet[] = [ISO9001, ISO14001, ISO45001, ISO22000, ISO27001]

export function docSetFor(standardId: string): DocSet {
  return DOC_SETS.find((s) => s.standardId === standardId) ?? GENERIC
}

/**
 * Filter a document set to what actually applies to this company.
 * ISO permits a requirement to be judged not applicable when it genuinely
 * does not affect the company's ability to deliver conforming work — but the
 * decision must be justified and recorded. `answers` holds the company's
 * applicability answers; anything unanswered is treated as applicable.
 */
export function applicableDocs(
  docs: RequiredDoc[],
  answers: Partial<Record<Applicability, boolean>>
): RequiredDoc[] {
  return docs.filter((d) => {
    if (!d.appliesIf || d.appliesIf === 'always') return true
    return answers[d.appliesIf] !== false
  })
}

/** The documents excluded by the current answers, for the justification record. */
export function excludedDocs(
  docs: RequiredDoc[],
  answers: Partial<Record<Applicability, boolean>>
): RequiredDoc[] {
  return docs.filter((d) => d.appliesIf && d.appliesIf !== 'always' && answers[d.appliesIf] === false)
}

export const EXCLUSION_REASONS: Record<Applicability, string> = {
  always: '',
  'if-design': 'The company does not design or develop its products or services; it works to customer or fixed specifications.',
  'if-measuring': 'The company does not rely on measuring equipment to determine conformity of its work.',
  'if-customer-property': 'The company does not hold property or data belonging to customers.',
}
