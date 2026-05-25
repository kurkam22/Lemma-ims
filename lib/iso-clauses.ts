export type Clause = {
  number: string
  title: string
  plain: string
  document: string
  evidence: string
  auditorAsks: string
}

export type Standard = {
  code: string
  name: string
  description: string
  shortCode: 'iso9001' | 'iso14001' | 'iso45001'
  clauses: Clause[]
}

export const ISO_9001_CLAUSES: Clause[] = [
  {
    number: '4.1',
    title: 'Understanding the organisation and its context',
    plain: "What's going on around you that affects your quality goals — markets, regulations, suppliers, competitors.",
    document: 'Context analysis document or SWOT/PESTLE summary',
    evidence: 'Current copy of the context analysis, reviewed within the last year',
    auditorAsks: 'Show me how you identify external and internal issues that affect your quality system.',
  },
  {
    number: '4.2',
    title: 'Needs and expectations of interested parties',
    plain: 'Who cares about what you do — customers, regulators, employees, owners — and what they expect.',
    document: 'Interested parties register',
    evidence: 'Up-to-date register listing parties, their needs, and how you address them',
    auditorAsks: 'Who are your interested parties and what do they expect from your QMS?',
  },
  {
    number: '4.3',
    title: 'Determining the scope of the QMS',
    plain: "What products, services, and sites your management system covers, and what's excluded.",
    document: 'Scope statement (often part of the quality manual)',
    evidence: 'Approved scope document covering products, services, sites, and exclusions with justification',
    auditorAsks: "What's the scope of your QMS? Why did you exclude any clauses?",
  },
  {
    number: '4.4',
    title: 'QMS and its processes',
    plain: 'The core activities that turn inputs into outputs, plus how they fit together and who owns them.',
    document: 'Process map or process flow diagram',
    evidence: 'Current process map with inputs, outputs, owners, and interactions',
    auditorAsks: 'Walk me through your core processes and how they connect.',
  },
  {
    number: '5.2',
    title: 'Quality policy',
    plain: 'A short statement from leadership about what quality means here and how you commit to it.',
    document: 'Signed quality policy statement',
    evidence: 'Current signed copy, communicated to employees, available to interested parties',
    auditorAsks: "Where is your quality policy? Can a random employee tell me what's in it?",
  },
  {
    number: '6.1',
    title: 'Actions to address risks and opportunities',
    plain: "The things that could go wrong (and the opportunities you could miss), and what you'll do about them.",
    document: 'Risk register or risk assessment',
    evidence: 'Active risk register with assessments and mitigation actions',
    auditorAsks: 'How do you identify and address risks to your QMS?',
  },
  {
    number: '6.2',
    title: 'Quality objectives',
    plain: 'Specific measurable quality goals tied to your policy, with deadlines and owners.',
    document: 'Quality objectives plan',
    evidence: 'Measurable objectives with targets, deadlines, owners, and progress tracking',
    auditorAsks: 'What are your quality objectives this year? How are you tracking them?',
  },
  {
    number: '7.2',
    title: 'Competence',
    plain: 'Making sure people doing the work have the right skills, training, and qualifications.',
    document: 'Competency matrix or job descriptions with training requirements',
    evidence: 'Training records, qualifications, evaluation of effectiveness',
    auditorAsks: 'How do you make sure people are competent for their roles?',
  },
  {
    number: '7.3',
    title: 'Awareness',
    plain: 'Making sure everyone knows the quality policy, their role in it, and what happens if things go wrong.',
    document: 'Awareness training plan or induction materials',
    evidence: 'Training records showing employees know the policy, objectives, and their contribution',
    auditorAsks: 'Pick an employee — can they explain how their work affects quality?',
  },
  {
    number: '7.4',
    title: 'Communication',
    plain: 'Who talks to whom about quality, internally and externally — and how.',
    document: 'Communication plan or matrix',
    evidence: 'Records of internal/external communication on quality matters',
    auditorAsks: 'How do you communicate about quality with your team and customers?',
  },
  {
    number: '7.5',
    title: 'Documented information',
    plain: 'The procedures, records, and information you keep, and how you control them (versions, approvals, retention).',
    document: 'Document control procedure',
    evidence: 'Document register with versions, approvals, distribution, retention',
    auditorAsks: 'Show me your latest procedure — who approved it, when, and how do people find the current version?',
  },
  {
    number: '8.1',
    title: 'Operational planning and control',
    plain: 'Planning and executing the work that delivers your product or service.',
    document: 'Operational planning procedure',
    evidence: 'Production plans, work orders, capacity records',
    auditorAsks: 'How do you plan and control the work that delivers your product?',
  },
  {
    number: '8.2',
    title: 'Customer requirements',
    plain: 'Capturing what customers actually need before, during, and after the sale — including changes.',
    document: 'Customer requirements review procedure',
    evidence: 'Order reviews, contracts, change records, customer communication logs',
    auditorAsks: 'How do you make sure you fully understand what each customer is ordering before you accept it?',
  },
  {
    number: '8.4',
    title: 'Externally provided processes, products and services',
    plain: 'Choosing, evaluating, and managing the people who supply you (materials, services, parts).',
    document: 'Supplier qualification and evaluation procedure',
    evidence: 'Approved supplier list with evaluations, incoming inspection records',
    auditorAsks: 'How do you choose and monitor your suppliers? Show me your approved supplier list.',
  },
  {
    number: '8.5',
    title: 'Production and service provision',
    plain: 'How you actually make the product or deliver the service, including handling, identification, and protection.',
    document: 'Production and service provision procedures',
    evidence: 'Work instructions, traceability records, handling and storage records',
    auditorAsks: 'Walk me through how a product is made from material arrival to shipment.',
  },
  {
    number: '9.1',
    title: 'Monitoring, measurement, analysis and evaluation',
    plain: 'What you measure, how often, and how you know your quality system is working.',
    document: 'Monitoring and measurement plan',
    evidence: 'KPI data, customer satisfaction results, data analysis reports',
    auditorAsks: 'What do you measure to know your QMS is working? Show me the data.',
  },
  {
    number: '9.2',
    title: 'Internal audit',
    plain: 'Regularly checking your own management system to find issues before an external auditor does.',
    document: 'Internal audit programme and procedure',
    evidence: 'Audit schedule, audit reports, follow-up records',
    auditorAsks: 'Show me your internal audit programme and the last few audit reports.',
  },
  {
    number: '9.3',
    title: 'Management review',
    plain: 'A regular meeting where leadership reviews how the quality system is performing and decides what to change.',
    document: 'Management review procedure and agenda',
    evidence: 'Minutes of management reviews covering required inputs and outputs',
    auditorAsks: 'When was your last management review? Show me the minutes and the actions that came out.',
  },
  {
    number: '10.2',
    title: 'Nonconformity and corrective action',
    plain: 'Investigating problems, fixing root causes, and preventing recurrence (Corrective and Preventive Action).',
    document: 'Corrective action procedure',
    evidence: 'CAPA register with investigations, root cause analyses, and verifications of effectiveness',
    auditorAsks: 'Pick a recent nonconformity — show me how you investigated and verified the fix worked.',
  },
  {
    number: '10.3',
    title: 'Continual improvement',
    plain: 'Continuously looking for ways to get better — not just fixing problems.',
    document: 'Improvement plan or continual improvement procedure',
    evidence: 'Improvement initiatives log with results, lessons learned',
    auditorAsks: 'What have you improved in the last year? Show me the evidence.',
  },
]

export const STANDARDS: Standard[] = [
  {
    code: 'ISO 9001:2015',
    name: 'Quality management',
    description: "The world's most widely adopted quality management standard. Applies to any organisation, of any size, in any industry.",
    shortCode: 'iso9001',
    clauses: ISO_9001_CLAUSES,
  },
  {
    code: 'ISO 14001:2015',
    name: 'Environmental management',
    description: 'Requirements for an environmental management system — how the organisation identifies and controls its environmental impacts.',
    shortCode: 'iso14001',
    clauses: [],
  },
  {
    code: 'ISO 45001:2018',
    name: 'Health and safety',
    description: 'Requirements for an occupational health and safety management system — preventing work-related injury and ill health.',
    shortCode: 'iso45001',
    clauses: [],
  },
]
