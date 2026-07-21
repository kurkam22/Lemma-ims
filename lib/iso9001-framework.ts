// ISO 9001:2015 — complete clause framework.
//
// This is the data spine that everything else plugs into: the guided setup,
// the questionnaires, the document generator, the readiness score, the views.
// It encodes what we mapped clause-by-clause. Explanations are our own plain
// words; official ISO text is never reproduced — clause numbers cited only.
//
// Design rules baked in here (from the whole design discussion):
//  - obligation tier is honest: required-document / required-evidence /
//    recommended / optional — never call a company choice an ISO demand.
//  - plain-language title first, ISO term second.
//  - questions drive documents; answers flow into outputs (registers etc).
//  - applicability lets a company exclude what genuinely doesn't apply,
//    with a recorded justification (clause 4.3 permits this).
//  - "aiResearch" flags where the AI may propose from industry knowledge
//    (outward-facing, safe) vs must use only the company's own data.

export type Obligation =
  | 'required-document' // ISO: shall be maintained as documented information
  | 'required-evidence' // ISO: shall retain documented information / records
  | 'recommended' // not demanded; the usual way to show conformity
  | 'optional' // entirely the company's choice

export type Applicability =
  | 'always'
  | 'if-design' // company designs/develops (8.3)
  | 'if-measuring' // uses measuring equipment for conformity (7.1.5)
  | 'if-customer-property' // holds customer goods/data (8.5.3)

export type OutputFormat = 'word' | 'excel' | 'pdf'
export type ViewKind = 'summary' | 'table' | 'diagram'

export type ClauseQuestion = {
  id: string
  q: string // plain-language question the company answers
  hint?: string
  // where the answer helps: which register/output it flows into
  feeds?: string
  // AI may propose answers from outward research (industry/regulation) then
  // the company confirms. If false/absent, AI uses only the company's data.
  aiResearch?: boolean
  // pull-forward: this answer usually already exists from an earlier clause
  prefillFrom?: string
}

export type ClauseDoc = {
  id: string
  title: string // plain-language
  isoTitle: string // ISO-style term (shown small)
  obligation: Obligation
  kind: 'maintain' | 'retain'
  formats: OutputFormat[]
  appliesIf?: Applicability
}

export type Clause = {
  id: string // "4.1"
  title: string // plain-language name
  isoTitle: string // ISO heading
  group: 'context' | 'leadership' | 'planning' | 'support' | 'operation' | 'evaluation' | 'improvement'
  // is this mainly a document to produce, a behaviour to demonstrate,
  // or an assembly/summary of data from elsewhere?
  mode: 'document' | 'behaviour' | 'assembly'
  plainIntro: string // one-line explanation for a beginner
  honestNote?: string // the key honesty point (what ISO does / doesn't demand)
  questions: ClauseQuestion[]
  documents: ClauseDoc[]
  inputsFrom: string[] // clause ids whose answers feed this one
  defaultViews: ViewKind[] // which view button to surface first
  uploadSuggestions: string[] // what the client can usefully upload here
  appliesIf?: Applicability // whole clause conditional (e.g. 8.3)
}

const wp: OutputFormat[] = ['word', 'pdf']
const xp: OutputFormat[] = ['excel', 'pdf']

export const ISO9001_CLAUSES: Clause[] = [
  // ============================ 4 — CONTEXT ============================
  {
    id: '4.1',
    title: 'Understand your company',
    isoTitle: 'Understanding the organization and its context',
    group: 'context',
    mode: 'document',
    plainIntro: 'What is going on inside and around your business that affects your quality.',
    honestNote:
      'ISO requires you to determine and monitor these issues, but does NOT demand a document. A context write-up is recommended because it feeds your scope and risks.',
    questions: [
      { id: 'str', q: 'What does your company do well? (skills, equipment, reputation, finances)', feeds: '6.1 opportunities' },
      { id: 'weak', q: 'Where does your company struggle? (gaps, old equipment, complaints, one-person dependencies)', feeds: '6.1 risks / 7.1.6 knowledge' },
      { id: 'ext-legal', q: 'Which laws, regulations or licences apply to your industry?', hint: 'The AI can suggest likely ones for your sector — you confirm.', aiResearch: true, feeds: '5.1.2 / 8.2' },
      { id: 'ext-market', q: 'What is happening in your market, economy, technology, and among competitors?', hint: 'The AI can research your industry and competitors — you confirm what is relevant.', aiResearch: true, feeds: '6.1' },
      { id: 'ext-social', q: 'Are customer tastes, habits or expectations changing?', aiResearch: true },
      { id: 'climate', q: 'Is climate change a relevant issue for your company? Why or why not?', hint: 'Required since the 2024 amendment.', feeds: '6.1' },
    ],
    documents: [
      { id: 'context', title: 'Context & interested parties', isoTitle: 'Organizational context', obligation: 'recommended', kind: 'maintain', formats: wp },
    ],
    inputsFrom: [],
    defaultViews: ['summary', 'table'],
    uploadSuggestions: ['Business plan', 'Company brochure or website', 'Market or competitor notes', '…or anything describing your company and its situation'],
  },
  {
    id: '4.2',
    title: 'Who matters to you',
    isoTitle: 'Needs and expectations of interested parties',
    group: 'context',
    mode: 'document',
    plainIntro: 'The people and organizations with a stake in your quality, and what they expect.',
    honestNote: 'Determine and monitor is required; a register is the recommended way to show it. You only need to consider expectations relevant to your quality.',
    questions: [
      { id: 'parties', q: 'Who has a stake in your quality? (customers, suppliers, staff, owners, regulators, community…)', aiResearch: true },
      { id: 'why', q: 'For each, why are they relevant to your quality?', hint: 'Auditors ask this — not just who, but why they matter.' },
      { id: 'expect', q: 'What does each one need or expect from you?', aiResearch: true, feeds: '6.1 / 8.2' },
      { id: 'relevant', q: 'Which of those expectations could actually affect your product quality or customer satisfaction?', hint: 'Keeps the list focused on what matters.' },
      { id: 'review', q: 'How often will you review this list, and why that interval?', feeds: '9.1 / 9.3' },
    ],
    documents: [
      { id: 'parties', title: 'Interested parties register', isoTitle: 'Interested parties', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.1'],
    defaultViews: ['table', 'diagram'],
    uploadSuggestions: ['Customer or supplier contracts', 'Org chart', 'Any regulator correspondence', '…or anything showing who you deal with'],
  },
  {
    id: '4.3',
    title: 'What your certificate covers',
    isoTitle: 'Determining the scope of the QMS',
    group: 'context',
    mode: 'document',
    plainIntro: 'The boundary around your quality system: what products, services and sites are included.',
    honestNote: 'REQUIRED document — the scope shall be maintained as documented information, and must justify anything you leave out.',
    questions: [
      { id: 'products', q: 'What products or services does your quality system cover?', prefillFrom: 'setup' },
      { id: 'sites', q: 'Which sites or locations are included?', prefillFrom: 'setup' },
      { id: 'exclude', q: 'Is anything deliberately left out — a product line, department or site — and why?' },
      { id: 'design', q: 'Do you design or develop your own products or services?', hint: 'If you only work to customer drawings or fixed recipes, answer no.', feeds: '8.3 applicability' },
      { id: 'measuring', q: 'Do you use measuring equipment to decide if work passes or fails?', feeds: '7.1.5 applicability' },
      { id: 'custprop', q: 'Do you hold anything belonging to customers (materials, tools, data)?', feeds: '8.5.3 applicability' },
    ],
    documents: [
      { id: 'scope', title: 'Scope statement', isoTitle: 'Scope of the QMS', obligation: 'required-document', kind: 'maintain', formats: wp },
    ],
    inputsFrom: ['4.1', '4.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Business licence', 'Product or service list', 'Site addresses', 'Existing scope statement if any', '…or anything describing what you do and where'],
  },
  {
    id: '4.4',
    title: 'How your work flows',
    isoTitle: 'QMS and its processes',
    group: 'context',
    mode: 'document',
    plainIntro: 'Your main processes and how they connect — each output becoming the next input.',
    honestNote: 'A process map is recommended (documentation is "to the extent necessary"); the criteria/KPIs and records the processes produce are required.',
    questions: [
      { id: 'list', q: 'What are your main processes? (e.g. handle orders, buy materials, make product, deliver)' },
      { id: 'io', q: 'For each process, what goes in and what comes out?', hint: 'The output of one is usually the input of the next — this is "interaction".' },
      { id: 'owner', q: 'Who is responsible for each process?', feeds: '5.3' },
      { id: 'kpi', q: 'How do you know each process is working? (a measure)', feeds: '9.1' },
      { id: 'prisk', q: 'What could go wrong in each process?', feeds: '6.1' },
    ],
    documents: [
      { id: 'processmap', title: 'Process map', isoTitle: 'Process interaction', obligation: 'recommended', kind: 'maintain', formats: ['pdf'] },
      { id: 'processcards', title: 'Process cards', isoTitle: 'Process descriptions', obligation: 'recommended', kind: 'maintain', formats: wp },
    ],
    inputsFrom: ['4.1', '4.2', '4.3'],
    defaultViews: ['diagram', 'table'],
    uploadSuggestions: ['Existing procedures or work instructions', 'Org chart', 'A flowchart if you have one', '…or just describe a normal day, from order to delivery'],
  },

  // ============================ 5 — LEADERSHIP ============================
  {
    id: '5.1.1',
    title: 'Leading quality from the top',
    isoTitle: 'Leadership and commitment',
    group: 'leadership',
    mode: 'behaviour',
    plainIntro: 'The owner/top management must genuinely lead quality — not just delegate it.',
    honestNote: 'No document exists for this. An auditor confirms it by interviewing you. We help you show it and keep proof.',
    questions: [
      { id: 'accountable', q: 'Do you (the owner) take personal responsibility for quality?' },
      { id: 'integrated', q: 'Is quality part of how you run the business day-to-day, or a separate box-ticking task?' },
      { id: 'resources', q: 'Have you made sure people have the time, money and tools for quality?' },
      { id: 'communicate', q: 'Do you tell staff why quality matters — and do they hear it from you?' },
      { id: 'evidence', q: 'Where can you show this? (meeting minutes, signed policy, training budget, all-hands)', feeds: 'evidence library' },
    ],
    documents: [
      { id: 'leadcheck', title: 'Leadership commitment check', isoTitle: 'Leadership evidence', obligation: 'recommended', kind: 'retain', formats: wp },
    ],
    inputsFrom: ['4.1', '4.2', '4.3'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Meeting minutes mentioning quality', 'Signed quality policy', 'Training or quality budget', '…or anything showing management involvement'],
  },
  {
    id: '5.1.2',
    title: 'Putting customers first',
    isoTitle: 'Customer focus',
    group: 'leadership',
    mode: 'behaviour',
    plainIntro: 'Making sure customer and legal requirements are met, risks addressed, and satisfaction watched.',
    honestNote: 'No document — this connects order reviews (8.2), risks (6.1) and satisfaction (9.1.2). We link them and check leadership drives it.',
    questions: [
      { id: 'requirements', q: 'Do you know exactly what customers require, and the laws that apply? Where is that written?', aiResearch: true, feeds: '8.2' },
      { id: 'check', q: 'Do you check you can meet an order before accepting it?', feeds: '8.2' },
      { id: 'satisfaction', q: 'How do you track whether customers are satisfied — and does the owner look at it?', feeds: '9.1.2' },
    ],
    documents: [],
    inputsFrom: ['4.2', '6.1', '8.2', '9.1.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Customer feedback or complaints', 'Order or contract examples', '…or anything about how you handle customers'],
  },
  {
    id: '5.2',
    title: 'Your quality promise',
    isoTitle: 'Quality policy',
    group: 'leadership',
    mode: 'document',
    plainIntro: 'A short written statement of your commitment to quality, from the top.',
    honestNote: 'REQUIRED document. It must include two commitments: to satisfy requirements, and to continually improve. We guarantee both are in every draft.',
    questions: [
      { id: 'commitments', q: 'What is your main quality commitment, in your own words?', hint: 'e.g. consistent quality, on-time delivery, customer satisfaction, meeting regulations' },
      { id: 'approver', q: 'Who approves and signs it?', prefillFrom: '5.3' },
      { id: 'communicate', q: 'How will staff see and understand it?' },
      { id: 'external', q: 'Will you share it outside — website, customers?' },
    ],
    documents: [
      { id: 'policy', title: 'Quality policy', isoTitle: 'Quality policy', obligation: 'required-document', kind: 'maintain', formats: wp },
    ],
    inputsFrom: ['4.1', '4.2', '6.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Existing policy if any', 'Mission or values statement', '…or just your commitments in plain words'],
  },
  {
    id: '5.3',
    title: 'Who does what',
    isoTitle: 'Roles, responsibilities and authorities',
    group: 'leadership',
    mode: 'document',
    plainIntro: 'Making clear who is responsible for what in the quality system.',
    honestNote: 'No document required, but a responsibilities table is recommended. Note: ISO 9001 dropped the "management representative" — you do NOT need one named person.',
    questions: [
      { id: 'roles', q: 'What roles exist in your company?', prefillFrom: 'setup' },
      { id: 'qmsowner', q: 'Who is responsible for the quality system overall? (need not be one person)' },
      { id: 'reporter', q: 'Who reports on how quality is performing to the owner?' },
      { id: 'processowners', q: 'Who owns each main process?', prefillFrom: '4.4' },
    ],
    documents: [
      { id: 'roles', title: 'Roles & responsibilities', isoTitle: 'Responsibility matrix', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.4'],
    defaultViews: ['table', 'diagram'],
    uploadSuggestions: ['Org chart', 'Job descriptions', '…or just a list of who does what'],
  },

  // ============================ 6 — PLANNING ============================
  {
    id: '6.1',
    title: 'What could go wrong (and your chances)',
    isoTitle: 'Actions to address risks and opportunities',
    group: 'planning',
    mode: 'document',
    plainIntro: 'The main risks to your quality and what you will DO about them — plus opportunities.',
    honestNote:
      'ISO does NOT require a risk procedure or even a formal register, and sets no method. A register is recommended. The real requirement is to plan actions and check they worked.',
    questions: [
      { id: 'risks', q: 'What are the main risks to your quality?', prefillFrom: '4.1 weaknesses/threats', aiResearch: true },
      { id: 'opps', q: 'What opportunities could you pursue?', prefillFrom: '4.1 strengths' },
      { id: 'rate', q: 'For each risk, how likely and how serious? (simple 1–3 scale — your choice)' },
      { id: 'action', q: 'What will you DO about each significant risk?', hint: 'This is the required part — not just listing, but acting.' },
      { id: 'owner', q: 'Who owns each action, and by when?' },
      { id: 'effective', q: 'Later: did the action actually work?', feeds: '9.3' },
    ],
    documents: [
      { id: 'risk', title: 'Risk & opportunity register', isoTitle: 'Risks and opportunities', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.1', '4.2', '4.4'],
    defaultViews: ['table', 'summary'],
    uploadSuggestions: ['Past incident or complaint records', 'Insurance risk assessments', '…or just what worries you about the business'],
  },
  {
    id: '6.2',
    title: 'Your goals with numbers',
    isoTitle: 'Quality objectives and planning',
    group: 'planning',
    mode: 'document',
    plainIntro: 'Measurable quality goals, each with an owner, a deadline, and how you will check success.',
    honestNote: 'REQUIRED document. Objectives MUST be measurable — "improve quality" is not enough. We coach you to turn goals into numbers.',
    questions: [
      { id: 'goal', q: 'What do you want to improve?', hint: 'We will help turn this into a measurable target.' },
      { id: 'metric', q: 'How will you measure it? (the number)', feeds: '9.1' },
      { id: 'target', q: 'What is the target and deadline?' },
      { id: 'owner', q: 'Who is responsible?' },
      { id: 'evaluate', q: 'How will you check whether you hit it?' },
    ],
    documents: [
      { id: 'objectives', title: 'Objectives register', isoTitle: 'Quality objectives', obligation: 'required-document', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['5.2', '6.1'],
    defaultViews: ['table'],
    uploadSuggestions: ['Existing KPIs or targets', 'Business goals', '…or just what you want to get better at'],
  },
  {
    id: '6.3',
    title: 'Handling changes',
    isoTitle: 'Planning of changes',
    group: 'planning',
    mode: 'behaviour',
    plainIntro: 'When you change the quality system, do it in a planned way rather than improvising.',
    honestNote: 'No standalone document — a short change record is enough. Light touch.',
    questions: [
      { id: 'what', q: 'What are you changing, and why?' },
      { id: 'impact', q: 'What could it affect? Who is responsible?' },
    ],
    documents: [
      { id: 'change', title: 'Change record', isoTitle: 'Change planning', obligation: 'optional', kind: 'retain', formats: wp },
    ],
    inputsFrom: ['4.4'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Notes on a planned change', '…or describe what you want to change'],
  },

  // ============================ 7 — SUPPORT ============================
  {
    id: '7.1',
    title: 'What you need to do the work',
    isoTitle: 'Resources',
    group: 'support',
    mode: 'document',
    plainIntro: 'The people, equipment, environment and know-how your work depends on.',
    honestNote: 'Mostly recommended records. Only calibration (7.1.5) is strictly required, and only if you measure things to decide pass/fail.',
    questions: [
      { id: 'infra', q: 'What buildings, equipment and systems does your work depend on, and how do you keep them working?', feeds: 'equipment list' },
      { id: 'environment', q: 'Does your work need particular conditions — clean, temperature-controlled, safe, quiet?' },
      { id: 'calib', q: 'What measuring equipment decides pass/fail, how often is it calibrated, and by whom?', hint: 'Only if you measure to decide acceptance.', feeds: 'calibration records' },
      { id: 'calib-wrong', q: 'What do you do if equipment is found out of calibration?', hint: 'ISO expects you to consider work already done with it.' },
      { id: 'knowledge', q: 'What know-how does your business depend on that lives in people’s heads? What would hurt if a key person left?', prefillFrom: '4.1 weaknesses', feeds: 'knowledge register' },
    ],
    documents: [
      { id: 'infra', title: 'Equipment & maintenance list', isoTitle: 'Infrastructure', obligation: 'recommended', kind: 'retain', formats: xp },
      { id: 'calibration', title: 'Calibration records', isoTitle: 'Monitoring & measuring resources', obligation: 'required-evidence', kind: 'retain', formats: xp, appliesIf: 'if-measuring' },
      { id: 'knowledge', title: 'Knowledge register', isoTitle: 'Organizational knowledge', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.4', '4.1'],
    defaultViews: ['table'],
    uploadSuggestions: ['Equipment list', 'Maintenance or calibration certificates', '…or a list of what you use to do the work'],
  },
  {
    id: '7.2',
    title: 'Proof your people can do the job',
    isoTitle: 'Competence',
    group: 'support',
    mode: 'document',
    plainIntro: 'What each role needs to know, and evidence your people know it.',
    honestNote: 'The EVIDENCE of competence is required. A competence procedure is only recommended — ISO does not demand one.',
    questions: [
      { id: 'roles', q: 'What roles affect your quality?', prefillFrom: '5.3' },
      { id: 'needs', q: 'For each role, what skills, training or experience are needed?' },
      { id: 'who', q: 'Who holds each role, and are they competent?' },
      { id: 'gap', q: 'Where there is a gap, what is the plan — train, mentor, hire?' },
      { id: 'records', q: 'How do you keep proof? (certificates, signed training records)', feeds: 'training records' },
    ],
    documents: [
      { id: 'matrix', title: 'Competence matrix', isoTitle: 'Competence matrix', obligation: 'recommended', kind: 'maintain', formats: xp },
      { id: 'training', title: 'Training records', isoTitle: 'Evidence of competence', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['5.3', '4.4'],
    defaultViews: ['table'],
    uploadSuggestions: ['Training certificates', 'Staff list with skills', '…or anything showing your people are trained'],
  },
  {
    id: '7.3',
    title: 'Staff know their part',
    isoTitle: 'Awareness',
    group: 'support',
    mode: 'behaviour',
    plainIntro: 'Every worker should know the policy, their goals, why their work matters, and what happens if they don’t follow it.',
    honestNote: 'No document — an auditor asks your staff directly. Short quizzes make good proof and double as competence evidence.',
    questions: [
      { id: 'briefed', q: 'Have you told staff about the quality policy, their goals, why their work matters, and the consequences of not following procedures?', feeds: 'awareness records' },
      { id: 'quiz', q: 'Would a short quiz per employee help you prove they understood?' },
    ],
    documents: [
      { id: 'awareness', title: 'Awareness / quiz records', isoTitle: 'Awareness evidence', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['5.2', '6.2', '7.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Induction materials', 'Toolbox-talk or briefing notes', '…or how you brief your staff'],
  },
  {
    id: '7.4',
    title: 'Who tells whom',
    isoTitle: 'Communication',
    group: 'support',
    mode: 'document',
    plainIntro: 'A simple plan of who shares quality information, with whom, and how.',
    honestNote: 'No document required — a short table is enough.',
    questions: [
      { id: 'what', q: 'What quality information needs sharing? (policy, changes, results, problems)' },
      { id: 'who', q: 'Who needs it, and who sends it?' },
      { id: 'how', q: 'When and how? (meeting, email, notice board)' },
    ],
    documents: [
      { id: 'comms', title: 'Communication plan', isoTitle: 'Communication', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.2'],
    defaultViews: ['table'],
    uploadSuggestions: ['Any existing comms plan', '…or just how you share information now'],
  },
  {
    id: '7.5',
    title: 'Keeping documents under control',
    isoTitle: 'Documented information',
    group: 'support',
    mode: 'behaviour',
    plainIntro: 'How documents are identified, approved, kept current and protected.',
    honestNote:
      'Lemma IS your document-control system — every document is automatically identified, version-controlled, approved and protected. A control procedure is only recommended; we can generate one describing how it works.',
    questions: [
      { id: 'external', q: 'Do you use documents from outside (customer specs, regulations, standards) that must be kept current?' },
      { id: 'retention', q: 'How long do you keep records before disposing of them?' },
    ],
    documents: [
      { id: 'doccontrol', title: 'Document control procedure', isoTitle: 'Control of documented information', obligation: 'recommended', kind: 'maintain', formats: wp },
    ],
    inputsFrom: [],
    defaultViews: ['summary'],
    uploadSuggestions: ['Any external standards or specs you follow', '…the platform already controls documents you create here'],
  },

  // ============================ 8 — OPERATION ============================
  {
    id: '8.1',
    title: 'How you make your product',
    isoTitle: 'Operational planning and control',
    group: 'operation',
    mode: 'document',
    plainIntro: 'The steps of your actual work, what "acceptable" looks like, and proof you followed them.',
    honestNote: 'Records "to the extent necessary". Your process cards from 4.4 feed straight in.',
    questions: [
      { id: 'steps', q: 'What are your operating steps for making the product or delivering the service?', prefillFrom: '4.4' },
      { id: 'accept', q: 'What does "acceptable" look like at each stage? (acceptance criteria)' },
      { id: 'records', q: 'What records prove the work was done as planned?' },
    ],
    documents: [
      { id: 'ops', title: 'Operating procedures', isoTitle: 'Operational control', obligation: 'recommended', kind: 'maintain', formats: wp },
      { id: 'prodrecords', title: 'Production records', isoTitle: 'Operational records', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['4.4', '6.1'],
    defaultViews: ['table', 'diagram'],
    uploadSuggestions: ['Work instructions', 'Inspection or production sheets', '…or describe your production/service steps'],
  },
  {
    id: '8.2',
    title: 'Checking you can deliver before you promise',
    isoTitle: 'Requirements for products and services',
    group: 'operation',
    mode: 'document',
    plainIntro: 'Before accepting an order, confirm you understand it and can meet it — and keep a record.',
    honestNote: 'REQUIRED evidence — retain results of order/requirement reviews.',
    questions: [
      { id: 'capture', q: 'How do you capture what a customer wants? (order, contract, spec)' },
      { id: 'review', q: 'How do you confirm you can meet it before saying yes?', feeds: 'order review records' },
      { id: 'legal', q: 'Do you check legal and regulatory requirements for the product?', aiResearch: true },
      { id: 'changes', q: 'How do you handle changes to an order?' },
    ],
    documents: [
      { id: 'orderreview', title: 'Order review records', isoTitle: 'Requirements review', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['4.2', '5.1.2'],
    defaultViews: ['table'],
    uploadSuggestions: ['Order forms or contracts', 'Quotation templates', '…or how you take and confirm orders'],
  },
  {
    id: '8.3',
    title: 'How you design new products',
    isoTitle: 'Design and development',
    group: 'operation',
    mode: 'document',
    plainIntro: 'If you design your own products/services: the inputs, reviews, checks and approvals.',
    honestNote: 'Only applies IF you design. If you work to customer drawings or fixed recipes, this is excluded with a recorded reason and skipped entirely.',
    appliesIf: 'if-design',
    questions: [
      { id: 'process', q: 'What do you design, and what are the stages?' },
      { id: 'inputs', q: 'What requirements go into a design? (function, performance, legal, past lessons, failure consequences)', feeds: 'design records' },
      { id: 'controls', q: 'How do you review, verify (met the inputs?) and validate (works in use?) a design?' },
      { id: 'outputs', q: 'How do you confirm the design output is complete and has acceptance criteria?' },
      { id: 'changes', q: 'How are design changes controlled and recorded?' },
    ],
    documents: [
      { id: 'design', title: 'Design records', isoTitle: 'Design & development records', obligation: 'required-evidence', kind: 'retain', formats: wp, appliesIf: 'if-design' },
    ],
    inputsFrom: ['4.3', '8.2'],
    defaultViews: ['summary', 'table'],
    uploadSuggestions: ['Design files or drawings', 'Design review notes', 'Test or validation results', '…or how you develop new products'],
  },
  {
    id: '8.4',
    title: 'Choosing and checking suppliers',
    isoTitle: 'Externally provided processes, products & services',
    group: 'operation',
    mode: 'document',
    plainIntro: 'How you select and re-check anyone you rely on — suppliers, subcontractors, outsourced work.',
    honestNote: 'Evaluation records are required. But YOU set how often to re-check, based on risk — ISO does not mandate a frequency.',
    questions: [
      { id: 'who', q: 'What or who do you buy that affects your quality?' },
      { id: 'criteria', q: 'How do you choose and check suppliers? (quality, delivery, price, certificates)' },
      { id: 'reeval', q: 'How often will you re-check suppliers, and why that interval?', hint: 'Base it on how much a bad supplier could hurt you. ISO sets no number.', feeds: 'supplier records' },
      { id: 'fail', q: 'What happens if a supplier fails your check?' },
    ],
    documents: [
      { id: 'supplier', title: 'Supplier evaluation records', isoTitle: 'Supplier evaluation', obligation: 'required-evidence', kind: 'retain', formats: xp },
      { id: 'approved', title: 'Approved supplier list', isoTitle: 'Approved suppliers', obligation: 'recommended', kind: 'maintain', formats: xp },
    ],
    inputsFrom: ['4.4'],
    defaultViews: ['table'],
    uploadSuggestions: ['Supplier list', 'Supplier certificates', 'Past evaluation notes', '…or who you buy from and how you check them'],
  },
  {
    id: '8.5',
    title: 'Controlling production & traceability',
    isoTitle: 'Production and service provision',
    group: 'operation',
    mode: 'document',
    plainIntro: 'Running production under control, identifying and tracing outputs, and looking after customer property.',
    honestNote: 'Traceability records required where traceability matters. Customer-property records required only if you hold customer goods/data (8.5.3).',
    questions: [
      { id: 'control', q: 'How do you keep production under control? (instructions, checks, competent people)' },
      { id: 'trace', q: 'Can you trace a batch or job back if there is a problem? How?', feeds: 'traceability records' },
      { id: 'custprop', q: 'Do you hold customer materials, tools or data? How do you protect them?', feeds: 'customer property records' },
      { id: 'preserve', q: 'How do you protect the product during handling, storage and delivery?' },
    ],
    documents: [
      { id: 'traceability', title: 'Traceability records', isoTitle: 'Identification & traceability', obligation: 'required-evidence', kind: 'retain', formats: xp },
      { id: 'custprop', title: 'Customer property records', isoTitle: 'Customer property', obligation: 'required-evidence', kind: 'retain', formats: xp, appliesIf: 'if-customer-property' },
    ],
    inputsFrom: ['8.1'],
    defaultViews: ['table'],
    uploadSuggestions: ['Batch or job records', 'Labelling or traceability system notes', '…or how you track and protect product'],
  },
  {
    id: '8.6',
    title: 'Proof it was checked before it left',
    isoTitle: 'Release of products and services',
    group: 'operation',
    mode: 'document',
    plainIntro: 'Evidence each product or service was checked and approved before delivery, and by whom.',
    honestNote: 'REQUIRED evidence — retain release records showing conformity and who authorized release.',
    questions: [
      { id: 'checks', q: 'What final checks happen before a product or service goes out?' },
      { id: 'authorize', q: 'Who signs off / authorizes release?', feeds: 'release records' },
    ],
    documents: [
      { id: 'release', title: 'Release records', isoTitle: 'Release of products/services', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['8.1'],
    defaultViews: ['table'],
    uploadSuggestions: ['Final inspection sheets', 'Sign-off or dispatch records', '…or how you approve work before it ships'],
  },
  {
    id: '8.7',
    title: 'What you do with bad output',
    isoTitle: 'Control of nonconforming outputs',
    group: 'operation',
    mode: 'document',
    plainIntro: 'Faulty work is separated, decided on (rework/scrap/concession) and never shipped by accident.',
    honestNote:
      'REQUIRED evidence — and SEPARATE from corrective action (10.2). 8.7 handles the bad item; 10.2 fixes the root cause. Do not merge them.',
    questions: [
      { id: 'detect', q: 'How is faulty work spotted?' },
      { id: 'quarantine', q: 'Where does it go so it cannot be used by mistake?' },
      { id: 'decide', q: 'Who decides its fate, and what are the options? (rework, scrap, accept with permission)', feeds: 'nonconformance records' },
      { id: 'customer', q: 'When do you tell the customer?' },
      { id: 'recheck', q: 'How do you confirm reworked items are now good?' },
    ],
    documents: [
      { id: 'nonconforming', title: 'Nonconforming output records', isoTitle: 'Nonconforming outputs', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['8.1', '8.6'],
    defaultViews: ['table'],
    uploadSuggestions: ['Reject or quarantine records', 'Concession forms', '…or how you handle faulty work'],
  },

  // ============================ 9 — EVALUATION ============================
  {
    id: '9.1',
    title: 'The numbers that show it works',
    isoTitle: 'Monitoring, measurement, analysis & evaluation',
    group: 'evaluation',
    mode: 'assembly',
    plainIntro: 'Pulling together your performance data — KPIs, complaints, supplier and satisfaction results.',
    honestNote: 'REQUIRED evidence of results. Mostly assembled from data you already capture elsewhere, not new questions.',
    questions: [
      { id: 'what', q: 'What will you monitor and measure? (from your objectives and processes)', prefillFrom: '6.2 / 4.4' },
      { id: 'satisfaction', q: 'How do you monitor customer satisfaction? (surveys, complaints, returns, repeat orders)', feeds: '9.1.2' },
      { id: 'analyse', q: 'How often do you review the results and decide what they mean?' },
    ],
    documents: [
      { id: 'monitoring', title: 'Monitoring & analysis records', isoTitle: 'Monitoring results', obligation: 'required-evidence', kind: 'retain', formats: xp },
      { id: 'satisfaction', title: 'Customer satisfaction records', isoTitle: 'Customer satisfaction', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['6.2', '8.4', '10.2'],
    defaultViews: ['summary', 'table'],
    uploadSuggestions: ['KPI or performance data', 'Customer survey results', 'Complaint logs', '…or any numbers you already track'],
  },
  {
    id: '9.2',
    title: 'Checking yourself before the auditor',
    isoTitle: 'Internal audit',
    group: 'evaluation',
    mode: 'document',
    plainIntro: 'Auditing your own system to find gaps before the certification body does.',
    honestNote:
      'REQUIRED evidence of programme and results. YOU justify how often — ISO says "planned intervals", not a fixed number. Auditors must not audit their own work. Lemma builds your checklist from the requirements.',
    questions: [
      { id: 'frequency', q: 'How often will you audit each area, and why?', hint: 'More often for important and problem-prone areas. No required number.' },
      { id: 'auditors', q: 'Who will audit what?', hint: 'Nobody may audit their own work — we will check this.' },
      { id: 'report', q: 'Who receives the results, and how do findings become actions?', feeds: '10.2' },
    ],
    documents: [
      { id: 'auditprog', title: 'Internal audit programme & reports', isoTitle: 'Internal audit', obligation: 'required-evidence', kind: 'retain', formats: wp },
    ],
    inputsFrom: ['4.4'],
    defaultViews: ['table'],
    uploadSuggestions: ['Past audit reports', 'An audit schedule', '…or Lemma can build your checklist and schedule'],
  },
  {
    id: '9.3',
    title: 'Management looks and decides',
    isoTitle: 'Management review',
    group: 'evaluation',
    mode: 'assembly',
    plainIntro: 'The owner reviews how quality is going and makes decisions — Lemma assembles the pack.',
    honestNote:
      'REQUIRED evidence of results. ISO lists exactly what to review — and Lemma already holds most of it (audits, complaints, objectives, suppliers, risks), so we assemble the agenda. You bring the decisions.',
    questions: [
      { id: 'frequency', q: 'How often will management review the system, and why?' },
      { id: 'attendees', q: 'Who attends the review?' },
      { id: 'decisions', q: 'What decisions and actions came out? (improvements, changes, resources)', feeds: '10.1' },
    ],
    documents: [
      { id: 'review', title: 'Management review minutes', isoTitle: 'Management review', obligation: 'required-evidence', kind: 'retain', formats: wp },
    ],
    inputsFrom: ['4.1', '4.2', '6.1', '6.2', '8.4', '9.1', '9.2', '10.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['Past review minutes', '…or Lemma assembles the pack from your data'],
  },

  // ============================ 10 — IMPROVEMENT ============================
  {
    id: '10.2',
    title: 'Problems, causes and fixes',
    isoTitle: 'Nonconformity and corrective action',
    group: 'improvement',
    mode: 'document',
    plainIntro: 'When something goes wrong: fix it, find WHY, and stop it coming back.',
    honestNote:
      'REQUIRED evidence. Correction (patching the symptom) is NOT the same as corrective action (fixing the root cause). ISO cares most about the root cause. Separate from 8.7.',
    questions: [
      { id: 'what', q: 'What happened, and where was it found? (audit, complaint, internal check)' },
      { id: 'correct', q: 'What did you do immediately to fix it? (correction)' },
      { id: 'rootcause', q: 'Why did it really happen?', hint: 'We will prompt a 5-Why to reach the true cause.' },
      { id: 'action', q: 'What will stop it recurring? (corrective action)', feeds: 'CAPA records' },
      { id: 'owner', q: 'Who owns it, by when?' },
      { id: 'effective', q: 'Later: did the fix actually work?' },
      { id: 'similar', q: 'Could the same problem exist elsewhere? Update your risks?', feeds: '6.1' },
    ],
    documents: [
      { id: 'capa', title: 'Corrective action records', isoTitle: 'Nonconformity & corrective action', obligation: 'required-evidence', kind: 'retain', formats: xp },
    ],
    inputsFrom: ['8.7', '9.1', '9.2'],
    defaultViews: ['table', 'summary'],
    uploadSuggestions: ['Complaint records', 'Past corrective actions', '…or describe a recent problem'],
  },
  {
    id: '10.3',
    title: 'Getting a bit better all the time',
    isoTitle: 'Continual improvement',
    group: 'improvement',
    mode: 'assembly',
    plainIntro: 'Improvement shown through closed problems, met goals and rising readiness — not a document.',
    honestNote: 'No document. It is demonstrated through the other clauses. Lemma tracks the trend over time.',
    questions: [
      { id: 'opportunities', q: 'What improvements have you identified from complaints, audits, and reviews?', prefillFrom: '9.3' },
    ],
    documents: [],
    inputsFrom: ['9.1', '9.3', '10.2'],
    defaultViews: ['summary'],
    uploadSuggestions: ['…improvement shows in your closed actions and met goals — no upload needed'],
  },
]

// -------- helpers used across the platform --------

export const OBLIGATION_META: Record<Obligation, { label: string; tone: 'red' | 'blue' | 'grey' }> = {
  'required-document': { label: 'ISO requires this in writing', tone: 'red' },
  'required-evidence': { label: 'ISO requires this record', tone: 'red' },
  recommended: { label: 'Recommended — not demanded by ISO', tone: 'blue' },
  optional: { label: 'Your choice', tone: 'grey' },
}

export const GROUP_LABELS: Record<Clause['group'], string> = {
  context: '1 · Understand your company',
  leadership: '2 · Leadership',
  planning: '3 · Plan',
  support: '4 · Support',
  operation: '5 · Do the work',
  evaluation: '6 · Check',
  improvement: '7 · Fix & improve',
}

export function clauseById(id: string): Clause | undefined {
  return ISO9001_CLAUSES.find((c) => c.id === id)
}

export function clausesInGroup(group: Clause['group']): Clause[] {
  return ISO9001_CLAUSES.filter((c) => c.group === group)
}

/** Clauses that apply, given the company's applicability answers. */
export function applicableClauses(answers: Partial<Record<Applicability, boolean>>): Clause[] {
  return ISO9001_CLAUSES.filter((c) => {
    if (!c.appliesIf || c.appliesIf === 'always') return true
    return answers[c.appliesIf] !== false
  })
}

/** Every required document across applicable clauses (for the master list / 7.5.1). */
export function requiredDocuments(answers: Partial<Record<Applicability, boolean>>): { clause: string; doc: ClauseDoc }[] {
  const out: { clause: string; doc: ClauseDoc }[] = []
  for (const c of applicableClauses(answers)) {
    for (const d of c.documents) {
      if (d.appliesIf && answers[d.appliesIf] === false) continue
      out.push({ clause: c.id, doc: d })
    }
  }
  return out
}
