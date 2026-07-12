// Required documents per standard — plain-language, clause-referenced.
// Explanations are our own words; official ISO text is never reproduced.

export type RequiredDoc = {
  id: string
  title: string
  clauseRef: string // reference only, e.g. "ISO 9001:2015 · 4.3"
  why: string // plain-language reason the document is needed
  mandatory: boolean
}

export type DocSet = {
  standardId: string
  standardLabel: string
  docs: RequiredDoc[]
}

const ISO9001: DocSet = {
  standardId: 'iso-9001',
  standardLabel: 'ISO 9001 — Quality Management',
  docs: [
    { id: 'q-scope', title: 'Scope of the QMS', clauseRef: 'ISO 9001:2015 · 4.3', mandatory: true, why: 'Defines which products, services and sites your quality system covers.' },
    { id: 'q-policy', title: 'Quality policy', clauseRef: 'ISO 9001:2015 · 5.2', mandatory: true, why: 'Your top-level commitment to quality, signed by management and shared with staff.' },
    { id: 'q-objectives', title: 'Quality objectives & plan', clauseRef: 'ISO 9001:2015 · 6.2', mandatory: true, why: 'Measurable goals (with owners and deadlines) that show quality is managed, not hoped for.' },
    { id: 'q-roles', title: 'Roles & responsibilities matrix', clauseRef: 'ISO 9001:2015 · 5.3', mandatory: true, why: 'Who is responsible for what — auditors check people know their duties.' },
    { id: 'q-risk', title: 'Risk & opportunity register', clauseRef: 'ISO 9001:2015 · 6.1', mandatory: true, why: 'The main risks to quality and what you do about them.' },
    { id: 'q-competence', title: 'Competence & training records', clauseRef: 'ISO 9001:2015 · 7.2', mandatory: true, why: 'Proof your people are trained and capable for their roles.' },
    { id: 'q-doc-control', title: 'Document control procedure', clauseRef: 'ISO 9001:2015 · 7.5', mandatory: true, why: 'How documents are approved, updated and kept current (no outdated copies in use).' },
    { id: 'q-operations', title: 'Operational / process procedures', clauseRef: 'ISO 9001:2015 · 8.1–8.5', mandatory: true, why: 'How your main processes actually run — the heart of the system.' },
    { id: 'q-suppliers', title: 'Supplier evaluation records', clauseRef: 'ISO 9001:2015 · 8.4', mandatory: true, why: 'How you choose and re-check suppliers so purchased items don’t break your quality.' },
    { id: 'q-release', title: 'Product/service release records', clauseRef: 'ISO 9001:2015 · 8.6', mandatory: true, why: 'Evidence that what you shipped was checked and approved.' },
    { id: 'q-nc', title: 'Nonconformity & corrective action records', clauseRef: 'ISO 9001:2015 · 10.2', mandatory: true, why: 'What went wrong, the root cause, the fix, and proof the fix worked.' },
    { id: 'q-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 9001:2015 · 9.2', mandatory: true, why: 'You checked your own system before the external auditor does.' },
    { id: 'q-review', title: 'Management review minutes', clauseRef: 'ISO 9001:2015 · 9.3', mandatory: true, why: 'Top management looked at the results and made decisions — with a record.' },
    { id: 'q-monitor', title: 'Monitoring & measurement results', clauseRef: 'ISO 9001:2015 · 9.1', mandatory: true, why: 'The numbers that show the system performs (complaints, defects, on-time delivery…).' },
  ],
}

const ISO14001: DocSet = {
  standardId: 'iso-14001',
  standardLabel: 'ISO 14001 — Environmental Management',
  docs: [
    { id: 'e-scope', title: 'Scope of the EMS', clauseRef: 'ISO 14001:2015 · 4.3', mandatory: true, why: 'Which activities and sites the environmental system covers.' },
    { id: 'e-policy', title: 'Environmental policy', clauseRef: 'ISO 14001:2015 · 5.2', mandatory: true, why: 'Management’s commitment to protecting the environment and meeting legal duties.' },
    { id: 'e-aspects', title: 'Environmental aspects & impacts register', clauseRef: 'ISO 14001:2015 · 6.1.2', mandatory: true, why: 'How your activities affect the environment (waste, emissions, energy, water) and which matter most.' },
    { id: 'e-legal', title: 'Legal & other requirements register', clauseRef: 'ISO 14001:2015 · 6.1.3', mandatory: true, why: 'The environmental laws and permits that apply to you, tracked in one place.' },
    { id: 'e-objectives', title: 'Environmental objectives & plans', clauseRef: 'ISO 14001:2015 · 6.2', mandatory: true, why: 'Measurable environmental goals with owners and deadlines.' },
    { id: 'e-competence', title: 'Competence & awareness records', clauseRef: 'ISO 14001:2015 · 7.2–7.3', mandatory: true, why: 'Staff know their environmental duties and are trained for them.' },
    { id: 'e-opcontrol', title: 'Operational control procedures', clauseRef: 'ISO 14001:2015 · 8.1', mandatory: true, why: 'How you control the operations that could harm the environment.' },
    { id: 'e-emergency', title: 'Emergency preparedness & response plan', clauseRef: 'ISO 14001:2015 · 8.2', mandatory: true, why: 'What you do if a spill, fire or other environmental emergency happens — and drills to prove it.' },
    { id: 'e-monitor', title: 'Monitoring & measurement records', clauseRef: 'ISO 14001:2015 · 9.1', mandatory: true, why: 'The data (waste volumes, consumption, emissions) showing performance and compliance.' },
    { id: 'e-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 14001:2015 · 9.2', mandatory: true, why: 'Your own check of the environmental system before the external audit.' },
    { id: 'e-review', title: 'Management review minutes', clauseRef: 'ISO 14001:2015 · 9.3', mandatory: true, why: 'Leadership reviewed environmental performance and decided improvements.' },
    { id: 'e-nc', title: 'Nonconformity & corrective action records', clauseRef: 'ISO 14001:2015 · 10.2', mandatory: true, why: 'Environmental problems, root causes and fixes — recorded.' },
  ],
}

const ISO45001: DocSet = {
  standardId: 'iso-45001',
  standardLabel: 'ISO 45001 — Occupational Health & Safety',
  docs: [
    { id: 's-scope', title: 'Scope of the OH&S system', clauseRef: 'ISO 45001:2018 · 4.3', mandatory: true, why: 'Which workplaces and activities the safety system covers.' },
    { id: 's-policy', title: 'OH&S policy', clauseRef: 'ISO 45001:2018 · 5.2', mandatory: true, why: 'Management’s commitment to safe, healthy workplaces.' },
    { id: 's-hazards', title: 'Hazard identification & risk assessment', clauseRef: 'ISO 45001:2018 · 6.1.2', mandatory: true, why: 'The dangers in your work, how serious they are, and the controls in place.' },
    { id: 's-legal', title: 'Legal requirements register', clauseRef: 'ISO 45001:2018 · 6.1.3', mandatory: true, why: 'The safety laws and rules that apply to you.' },
    { id: 's-objectives', title: 'OH&S objectives & plans', clauseRef: 'ISO 45001:2018 · 6.2', mandatory: true, why: 'Measurable safety goals (incidents down, training up) with owners.' },
    { id: 's-competence', title: 'Competence & training records', clauseRef: 'ISO 45001:2018 · 7.2', mandatory: true, why: 'Proof workers are trained for the risks of their job.' },
    { id: 's-participation', title: 'Worker consultation & participation records', clauseRef: 'ISO 45001:2018 · 5.4', mandatory: true, why: 'Evidence workers are consulted on safety — a 45001 speciality auditors check.' },
    { id: 's-opcontrol', title: 'Operational control procedures', clauseRef: 'ISO 45001:2018 · 8.1', mandatory: true, why: 'How dangerous work is controlled (permits, PPE, contractor rules).' },
    { id: 's-emergency', title: 'Emergency preparedness & response plan', clauseRef: 'ISO 45001:2018 · 8.2', mandatory: true, why: 'What happens in an accident, fire or emergency — with drills.' },
    { id: 's-incident', title: 'Incident investigation records', clauseRef: 'ISO 45001:2018 · 10.2', mandatory: true, why: 'Accidents and near-misses investigated to the root cause.' },
    { id: 's-monitor', title: 'Monitoring & measurement records', clauseRef: 'ISO 45001:2018 · 9.1', mandatory: true, why: 'Safety performance data (incidents, inspections, exposure checks).' },
    { id: 's-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 45001:2018 · 9.2', mandatory: true, why: 'Your own safety-system check before certification.' },
    { id: 's-review', title: 'Management review minutes', clauseRef: 'ISO 45001:2018 · 9.3', mandatory: true, why: 'Leadership reviewed safety performance and acted.' },
  ],
}

const ISO22000: DocSet = {
  standardId: 'iso-22000',
  standardLabel: 'ISO 22000 — Food Safety',
  docs: [
    { id: 'f-scope', title: 'Scope of the FSMS', clauseRef: 'ISO 22000:2018 · 4.3', mandatory: true, why: 'Which products, processes and sites the food-safety system covers.' },
    { id: 'f-policy', title: 'Food safety policy', clauseRef: 'ISO 22000:2018 · 5.2', mandatory: true, why: 'Management’s commitment to safe food.' },
    { id: 'f-team', title: 'Food safety team & roles', clauseRef: 'ISO 22000:2018 · 5.3', mandatory: true, why: 'The named team responsible for the HACCP study and the system.' },
    { id: 'f-prp', title: 'PRPs (prerequisite programmes)', clauseRef: 'ISO 22000:2018 · 8.2', mandatory: true, why: 'The basic hygiene foundations: cleaning, pest control, personal hygiene, maintenance.' },
    { id: 'f-product', title: 'Product descriptions & intended use', clauseRef: 'ISO 22000:2018 · 8.5.1', mandatory: true, why: 'What the product is, its ingredients/allergens, and who will consume it.' },
    { id: 'f-flow', title: 'Process flow diagrams', clauseRef: 'ISO 22000:2018 · 8.5.1', mandatory: true, why: 'Every step from raw material to dispatch — the map the hazard analysis walks.' },
    { id: 'f-hazard', title: 'Hazard analysis', clauseRef: 'ISO 22000:2018 · 8.5.2', mandatory: true, why: 'Biological, chemical and physical hazards at each step, and how serious they are.' },
    { id: 'f-ccp', title: 'CCP / OPRP plan (control measures)', clauseRef: 'ISO 22000:2018 · 8.5.4', mandatory: true, why: 'The critical points where control is essential — limits, monitoring, corrections.' },
    { id: 'f-traceability', title: 'Traceability system & records', clauseRef: 'ISO 22000:2018 · 8.3', mandatory: true, why: 'You can trace any batch one step back and one step forward.' },
    { id: 'f-recall', title: 'Withdrawal / recall procedure', clauseRef: 'ISO 22000:2018 · 8.9.5', mandatory: true, why: 'How you pull unsafe product from the market fast — tested with a mock recall.' },
    { id: 'f-monitor', title: 'Monitoring records (temperatures, checks)', clauseRef: 'ISO 22000:2018 · 8.5.4.3', mandatory: true, why: 'The daily proof control points stay within limits.' },
    { id: 'f-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO 22000:2018 · 9.2', mandatory: true, why: 'Your own food-safety check before the certifier arrives.' },
    { id: 'f-review', title: 'Management review minutes', clauseRef: 'ISO 22000:2018 · 9.3', mandatory: true, why: 'Leadership reviewed food-safety performance and decided actions.' },
  ],
}

const ISO27001: DocSet = {
  standardId: 'iso-27001',
  standardLabel: 'ISO/IEC 27001 — Information Security',
  docs: [
    { id: 'i-scope', title: 'Scope of the ISMS', clauseRef: 'ISO/IEC 27001:2022 · 4.3', mandatory: true, why: 'Which systems, data and locations the security system covers.' },
    { id: 'i-policy', title: 'Information security policy', clauseRef: 'ISO/IEC 27001:2022 · 5.2', mandatory: true, why: 'Management’s commitment to protecting information.' },
    { id: 'i-risk-method', title: 'Risk assessment methodology', clauseRef: 'ISO/IEC 27001:2022 · 6.1.2', mandatory: true, why: 'How you identify and score security risks — consistently.' },
    { id: 'i-risk', title: 'Risk assessment & treatment plan', clauseRef: 'ISO/IEC 27001:2022 · 6.1.3', mandatory: true, why: 'Your actual risks and what you decided to do about each.' },
    { id: 'i-soa', title: 'Statement of Applicability (SoA)', clauseRef: 'ISO/IEC 27001:2022 · 6.1.3 d', mandatory: true, why: 'The signature 27001 document: which Annex A controls apply, and why or why not.' },
    { id: 'i-objectives', title: 'Security objectives', clauseRef: 'ISO/IEC 27001:2022 · 6.2', mandatory: true, why: 'Measurable security goals with owners.' },
    { id: 'i-competence', title: 'Competence & awareness records', clauseRef: 'ISO/IEC 27001:2022 · 7.2–7.3', mandatory: true, why: 'Staff trained on security duties; awareness proven.' },
    { id: 'i-access', title: 'Access control & key operating procedures', clauseRef: 'ISO/IEC 27001:2022 · Annex A', mandatory: true, why: 'Who can access what, joiner/leaver process, backups, incident response.' },
    { id: 'i-incident', title: 'Security incident records', clauseRef: 'ISO/IEC 27001:2022 · Annex A 5.24–5.28', mandatory: true, why: 'Incidents logged, handled and learned from.' },
    { id: 'i-audit', title: 'Internal audit programme & reports', clauseRef: 'ISO/IEC 27001:2022 · 9.2', mandatory: true, why: 'Your own ISMS check before certification.' },
    { id: 'i-review', title: 'Management review minutes', clauseRef: 'ISO/IEC 27001:2022 · 9.3', mandatory: true, why: 'Leadership reviewed security performance and decided actions.' },
    { id: 'i-nc', title: 'Nonconformity & corrective action records', clauseRef: 'ISO/IEC 27001:2022 · 10.2', mandatory: true, why: 'Security problems fixed at the root, with records.' },
  ],
}

const GENERIC: DocSet = {
  standardId: 'generic',
  standardLabel: 'Management system (Annex SL common structure)',
  docs: [
    { id: 'g-scope', title: 'Scope of the management system', clauseRef: 'clause 4.3', mandatory: true, why: 'Defines what the system covers.' },
    { id: 'g-policy', title: 'Policy', clauseRef: 'clause 5.2', mandatory: true, why: 'Management’s top-level commitment.' },
    { id: 'g-objectives', title: 'Objectives & plans', clauseRef: 'clause 6.2', mandatory: true, why: 'Measurable goals with owners and deadlines.' },
    { id: 'g-risk', title: 'Risk & opportunity register', clauseRef: 'clause 6.1', mandatory: true, why: 'Main risks and how you address them.' },
    { id: 'g-competence', title: 'Competence & training records', clauseRef: 'clause 7.2', mandatory: true, why: 'Proof people are capable for their roles.' },
    { id: 'g-doc', title: 'Document control procedure', clauseRef: 'clause 7.5', mandatory: true, why: 'Documents approved, current, and controlled.' },
    { id: 'g-ops', title: 'Operational procedures', clauseRef: 'clause 8', mandatory: true, why: 'How the core work is done and controlled.' },
    { id: 'g-monitor', title: 'Monitoring & measurement results', clauseRef: 'clause 9.1', mandatory: true, why: 'Performance data for the system.' },
    { id: 'g-audit', title: 'Internal audit programme & reports', clauseRef: 'clause 9.2', mandatory: true, why: 'Your own check before the external audit.' },
    { id: 'g-review', title: 'Management review minutes', clauseRef: 'clause 9.3', mandatory: true, why: 'Leadership reviewed and decided.' },
    { id: 'g-nc', title: 'Nonconformity & corrective action records', clauseRef: 'clause 10.2', mandatory: true, why: 'Problems fixed at the root, with records.' },
  ],
}

export const DOC_SETS: DocSet[] = [ISO9001, ISO14001, ISO45001, ISO22000, ISO27001]

export function docSetFor(standardId: string): DocSet {
  return DOC_SETS.find((s) => s.standardId === standardId) ?? GENERIC
}
