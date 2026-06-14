// Full catalogue of management-system standards offered by Lemma IMS.
//
// This is the master list shown in the Standards Library and selectable
// throughout the platform. Standards with `clauses` wired up (in
// lib/iso-clauses.ts) support the AI compliance checker; the rest are
// catalogued for selection, diagnostics, and roadmap display.
//
// `certifiable` = an accredited certificate can be issued against it today.
// Some entries (FSSC 22000, HACCP, GMP) are schemes/prerequisites rather than
// ISO MSS, but clients ask for them in the same breath, so they belong here.

export type StandardCategory =
  | 'quality'
  | 'food'
  | 'environment'
  | 'safety'
  | 'information'
  | 'energy'
  | 'governance'
  | 'sector'
  | 'continuity'

export type CatalogueStandard = {
  code: string
  shortCode: string
  name: string
  category: StandardCategory
  description: string
  whoNeedsIt: string
  certifiable: boolean
  edition?: string
  note?: string
}

export const CATEGORY_LABELS: Record<StandardCategory, string> = {
  quality: 'Quality',
  food: 'Food safety',
  environment: 'Environment',
  safety: 'Health & safety',
  information: 'Information & privacy',
  energy: 'Energy',
  governance: 'Governance & anti-bribery',
  sector: 'Sector-specific',
  continuity: 'Business continuity',
}

export const STANDARDS_CATALOGUE: CatalogueStandard[] = [
  // ---------- Quality ----------
  {
    code: 'ISO 9001:2015',
    shortCode: 'iso9001',
    name: 'Quality management',
    category: 'quality',
    description:
      "The world's most widely adopted quality management standard. Applies to any organisation, of any size, in any industry.",
    whoNeedsIt:
      'Almost any organisation: process control, stable quality, customer satisfaction, tenders, export.',
    certifiable: true,
    edition: '2015',
  },
  {
    code: 'ISO 9001:2026',
    shortCode: 'iso9001-2026',
    name: 'Quality management (new edition)',
    category: 'quality',
    description:
      'The revised edition adding quality culture, ethical behaviour, stronger leadership, climate, and a clearer split of risk vs opportunity.',
    whoNeedsIt:
      'Organisations preparing for the upcoming revision; transition required by ~Sept 2029.',
    certifiable: false,
    edition: '2026',
    note: 'Not yet published (expected fall 2026). Not certifiable until certification bodies are accredited (~Q3 2027). 2015 certificates remain valid until Sept 2029.',
  },

  // ---------- Food safety (extra depth as requested) ----------
  {
    code: 'ISO 22000:2018',
    shortCode: 'iso22000',
    name: 'Food safety management',
    category: 'food',
    description:
      'Food safety management system for any organisation in the food chain, built around HACCP principles and prerequisite programmes (PRPs).',
    whoNeedsIt:
      'Food producers, processors, packaging, storage, transport, catering — anyone in the food chain.',
    certifiable: true,
    edition: '2018',
  },
  {
    code: 'FSSC 22000',
    shortCode: 'fssc22000',
    name: 'Food safety system certification',
    category: 'food',
    description:
      'GFSI-recognised certification scheme built on ISO 22000 plus sector-specific PRPs (ISO/TS 22002-x) and additional requirements. Often demanded by global retailers.',
    whoNeedsIt:
      'Food manufacturers supplying major retailers/brands needing GFSI recognition.',
    certifiable: true,
    note: 'A certification scheme, not an ISO standard. Built on ISO 22000 + ISO/TS 22002 PRPs.',
  },
  {
    code: 'HACCP (Codex Alimentarius)',
    shortCode: 'haccp',
    name: 'Hazard analysis & critical control points',
    category: 'food',
    description:
      'The foundational food-safety methodology: identify hazards, set critical control points, limits, monitoring, and corrective action. Underlies ISO 22000 and most food schemes.',
    whoNeedsIt:
      'Any food business; often a legal requirement and a building block for ISO 22000/FSSC.',
    certifiable: true,
    note: 'A methodology/prerequisite rather than a management-system standard.',
  },
  {
    code: 'ISO/TS 22002-1',
    shortCode: 'iso22002',
    name: 'Prerequisite programmes — food manufacturing',
    category: 'food',
    description:
      'Detailed prerequisite programmes (PRPs) for food manufacturing: construction, layout, utilities, waste, pest control, hygiene, allergen management. Required by FSSC 22000.',
    whoNeedsIt: 'Food manufacturers pursuing FSSC 22000.',
    certifiable: false,
    note: 'A technical specification used with ISO 22000, not separately certifiable.',
  },
  {
    code: 'BRCGS Food Safety',
    shortCode: 'brcgs',
    name: 'BRCGS global food safety standard',
    category: 'food',
    description:
      'GFSI-recognised food safety standard widely required by UK/EU retailers. Covers HACCP, quality management, site and product control, process and personnel.',
    whoNeedsIt:
      'Food manufacturers supplying UK/European retailers and brand owners.',
    certifiable: true,
    note: 'A GFSI scheme (BRCGS), not ISO. Common alternative/complement to FSSC 22000.',
  },
  {
    code: 'IFS Food',
    shortCode: 'ifs',
    name: 'International Featured Standards — Food',
    category: 'food',
    description:
      'GFSI-recognised standard for food manufacturers, prominent with German/French retailers. Covers food safety and quality of processed foods.',
    whoNeedsIt: 'Food manufacturers supplying continental European retailers.',
    certifiable: true,
    note: 'A GFSI scheme (IFS), not ISO.',
  },
  {
    code: 'GLOBALG.A.P.',
    shortCode: 'globalgap',
    name: 'Good Agricultural Practice',
    category: 'food',
    description:
      'Farm-level assurance for safe, sustainable agricultural production — crops, livestock, aquaculture. Covers food safety, traceability, environment, worker welfare.',
    whoNeedsIt: 'Farms, growers, and primary producers supplying retailers/exporters.',
    certifiable: true,
    note: 'A scheme for primary production (pre-farm-gate), complements ISO 22000.',
  },
  {
    code: 'ISO 22005:2007',
    shortCode: 'iso22005',
    name: 'Traceability in the feed & food chain',
    category: 'food',
    description:
      'Principles and requirements for designing and implementing a feed and food traceability system.',
    whoNeedsIt: 'Food/feed businesses needing robust traceability and recall capability.',
    certifiable: true,
  },

  // ---------- Environment ----------
  {
    code: 'ISO 14001:2015',
    shortCode: 'iso14001',
    name: 'Environmental management',
    category: 'environment',
    description:
      'Environmental management system — identify and control environmental impacts, meet compliance obligations, improve performance.',
    whoNeedsIt:
      'Organisations with environmental impact: waste, emissions, discharges, chemicals, resources.',
    certifiable: true,
    edition: '2015',
  },
  {
    code: 'ISO 14001:2026',
    shortCode: 'iso14001-2026',
    name: 'Environmental management (new edition)',
    category: 'environment',
    description:
      'Revised edition emphasising climate change, biodiversity and ecosystems, lifecycle thinking, supplier requirements, and data reliability.',
    whoNeedsIt: 'Organisations preparing to transition from the 2015 edition.',
    certifiable: false,
    edition: '2026',
    note: 'Use the Transition tool to migrate from ISO 14001:2015.',
  },
  {
    code: 'ISO 50001:2018',
    shortCode: 'iso50001',
    name: 'Energy management',
    category: 'energy',
    description:
      'Energy management system to improve energy performance, efficiency, and consumption through significant energy uses (SEU), baselines (EnB), and indicators (EnPI).',
    whoNeedsIt:
      'Energy-intensive organisations or any wanting to cut energy cost and consumption.',
    certifiable: true,
    edition: '2018',
  },

  // ---------- Health & safety ----------
  {
    code: 'ISO 45001:2018',
    shortCode: 'iso45001',
    name: 'Occupational health & safety',
    category: 'safety',
    description:
      'Occupational health and safety management system — prevent work-related injury and ill health, eliminate hazards, ensure worker participation.',
    whoNeedsIt:
      'Manufacturing, construction, warehousing, transport — any work with risks to workers.',
    certifiable: true,
    edition: '2018',
  },

  // ---------- Information & privacy ----------
  {
    code: 'ISO/IEC 27001:2022',
    shortCode: 'iso27001',
    name: 'Information security management',
    category: 'information',
    description:
      'Information security management system (ISMS) — manage risks to the confidentiality, integrity, and availability of information via Annex A controls and a Statement of Applicability.',
    whoNeedsIt:
      'IT, SaaS, finance, data processors, anyone handling sensitive or personal data.',
    certifiable: true,
    edition: '2022',
  },
  {
    code: 'ISO/IEC 27701:2019',
    shortCode: 'iso27701',
    name: 'Privacy information management',
    category: 'information',
    description:
      'Privacy extension to ISO 27001 for managing personally identifiable information (PII) as a controller or processor — supports GDPR alignment.',
    whoNeedsIt: 'Organisations processing personal data that need a privacy management system.',
    certifiable: true,
    note: 'An extension of ISO 27001; implemented alongside it.',
  },
  {
    code: 'ISO/IEC 42001:2023',
    shortCode: 'iso42001',
    name: 'AI management system',
    category: 'information',
    description:
      'The first management-system standard for artificial intelligence — responsible development and use of AI systems, risk and impact management.',
    whoNeedsIt: 'Organisations developing or deploying AI that want governance and assurance.',
    certifiable: true,
    edition: '2023',
  },

  // ---------- Governance & anti-bribery ----------
  {
    code: 'ISO 37001:2016',
    shortCode: 'iso37001',
    name: 'Anti-bribery management',
    category: 'governance',
    description:
      'Anti-bribery management system — policies and controls for bribery risk, gifts, conflicts of interest, due diligence, and whistle-blowing.',
    whoNeedsIt:
      'Organisations with public procurement, permits, agents/intermediaries, or high bribery risk.',
    certifiable: true,
    edition: '2016',
  },
  {
    code: 'ISO 37301:2021',
    shortCode: 'iso37301',
    name: 'Compliance management',
    category: 'governance',
    description:
      'Compliance management system — identify compliance obligations and manage them systematically across the organisation.',
    whoNeedsIt: 'Regulated organisations wanting a structured compliance framework.',
    certifiable: true,
  },

  // ---------- Sector-specific ----------
  {
    code: 'ISO 13485:2016',
    shortCode: 'iso13485',
    name: 'Medical devices — quality management',
    category: 'sector',
    description:
      'Quality management system for medical devices — regulatory requirements, device lifecycle, traceability, sterility, and risk management.',
    whoNeedsIt: 'Medical device manufacturers, importers, and service providers.',
    certifiable: true,
    edition: '2016',
  },
  {
    code: 'ISO 21001:2018',
    shortCode: 'iso21001',
    name: 'Educational organisations',
    category: 'sector',
    description:
      'Management system for educational organisations — learner needs, educational processes, and learning outcomes.',
    whoNeedsIt: 'Training centres, schools, universities, education providers.',
    certifiable: true,
  },
  {
    code: 'ISO 55001:2014',
    shortCode: 'iso55001',
    name: 'Asset management',
    category: 'sector',
    description:
      'Asset management system — lifecycle management of physical assets, maintenance, reliability, and risk of failure.',
    whoNeedsIt: 'Organisations with large portfolios of critical assets and infrastructure.',
    certifiable: true,
  },
  {
    code: 'IATF 16949:2016',
    shortCode: 'iatf16949',
    name: 'Automotive quality management',
    category: 'sector',
    description:
      'Automotive sector quality management, built on ISO 9001 with additional automotive-specific requirements.',
    whoNeedsIt: 'Automotive parts manufacturers and suppliers in the OEM supply chain.',
    certifiable: true,
    note: 'Implemented together with ISO 9001.',
  },
  {
    code: 'ISO/IEC 17025:2017',
    shortCode: 'iso17025',
    name: 'Testing & calibration laboratories',
    category: 'sector',
    description:
      'Competence requirements for testing and calibration laboratories — valid, reliable results and accreditation.',
    whoNeedsIt: 'Laboratories needing accreditation for testing or calibration.',
    certifiable: true,
  },

  // ---------- Business continuity ----------
  {
    code: 'ISO 22301:2019',
    shortCode: 'iso22301',
    name: 'Business continuity management',
    category: 'continuity',
    description:
      'Business continuity management system — prepare for, respond to, and recover from disruptions using BIA, RTO/RPO, and tested recovery plans.',
    whoNeedsIt:
      'Critical-service providers, IT, finance, logistics — anywhere downtime is costly.',
    certifiable: true,
    edition: '2019',
  },
]

export function standardsByCategory(): Record<StandardCategory, CatalogueStandard[]> {
  const out = {} as Record<StandardCategory, CatalogueStandard[]>
  for (const s of STANDARDS_CATALOGUE) {
    ;(out[s.category] ??= []).push(s)
  }
  return out
}
