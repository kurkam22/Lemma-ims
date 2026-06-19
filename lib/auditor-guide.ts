// Guidance for choosing a certification body (the auditor that issues the
// certificate). Grounded in current accreditation facts. This is reference
// content + an interactive evaluation checklist — not legal advice.

export type AuditorCriterion = {
  id: string
  title: string
  why: string
  whatToCheck: string
  weight: 'critical' | 'important' | 'helpful'
}

export const AUDITOR_CRITERIA: AuditorCriterion[] = [
  {
    id: 'accreditation',
    title: 'Accreditation (non-negotiable)',
    why: 'An unaccredited certificate can be rejected by customers, tenders, and export partners. This is the single most important check.',
    whatToCheck:
      'Confirm the certification body is accredited by a recognised national accreditation body (e.g. UKAS, ANAB, DAkkS, JAS-ANZ, NABCB) that operates under the IAF/ILAC (now Global ACI) multilateral recognition arrangement for management systems.',
    weight: 'critical',
  },
  {
    id: 'scope',
    title: 'Accredited for YOUR standard and sector',
    why: 'Accreditation is granted per standard and per economic sector. A body accredited for ISO 9001 in manufacturing may not be accredited for your standard or industry.',
    whatToCheck:
      'Ask which specific standards (e.g. ISO 9001, 14001, 22000) and which industry sectors they are accredited to certify. Verify the scope covers your business.',
    weight: 'critical',
  },
  {
    id: 'verify',
    title: 'Independent verification',
    why: "Don't take the body's word for it — accreditation status can lapse. Verify it yourself.",
    whatToCheck:
      'Check the certification body and its accreditation on the IAF CertSearch database, or directly on the national accreditation body\u2019s register. This takes ~15 minutes.',
    weight: 'critical',
  },
  {
    id: 'impartiality',
    title: 'Impartiality (no consulting + certifying)',
    why: 'A body that both consults on your system and certifies it has a conflict of interest and the certificate may be invalid. The roles must be separate.',
    whatToCheck:
      'Confirm the certification body did not provide your consultancy/implementation. Auditors cannot advise on fixing gaps and then certify the same system.',
    weight: 'critical',
  },
  {
    id: 'price-days',
    title: 'Realistic audit duration & price',
    why: 'Minimum audit days are set by accreditation rules based on your size and complexity. A quote far below others usually means too few audit days — a sign of a non-credible certificate.',
    whatToCheck:
      'Be wary of quotes 50\u201370% cheaper than accredited bodies. Ask how many audit days are proposed and how that aligns with your headcount and scope.',
    weight: 'important',
  },
  {
    id: 'experience',
    title: 'Sector & industry experience',
    why: 'An auditor who understands your industry adds value and reduces friction; a generalist may miss context or over-flag.',
    whatToCheck:
      'Ask about their track record in your sector and the experience of the actual auditors who will visit, not just the company brand.',
    weight: 'important',
  },
  {
    id: 'logistics',
    title: 'Location, language & availability',
    why: 'Travel costs, audit scheduling, and language affect cost and smoothness, especially for multi-site or non-English operations.',
    whatToCheck:
      'Confirm they can audit in your language and region, and their lead time for Stage 1 / Stage 2 audits fits your target date.',
    weight: 'helpful',
  },
  {
    id: 'reputation',
    title: 'Reputation & continuity',
    why: 'You will work with this body for the 3-year certification cycle (surveillance audits), so stability and service matter.',
    whatToCheck:
      'Check references, reviews, how long they have operated, and how surveillance audits and recertification are handled.',
    weight: 'helpful',
  },
]

export const AUDITOR_RED_FLAGS: string[] = [
  'Cannot or will not name their accreditation body.',
  'Price is dramatically lower than accredited competitors (too few audit days).',
  'Offers to help you write/fix your documents AND certify you (impartiality breach).',
  'Pressures you to certify quickly without a Stage 1 readiness review.',
  'Accreditation cannot be found on IAF CertSearch or the national register.',
  'Vague about which standards and sectors they are accredited for.',
  'Guarantees you will pass — a credible body cannot promise an outcome.',
]

// Questions the company answers; "no"/"unsure" on a critical item is a stop sign.
export const AUDITOR_CHECKLIST: { id: string; question: string; critical: boolean }[] = [
  { id: 'q-accredited', question: 'Is the body accredited by a recognised national accreditation body (IAF/ILAC member)?', critical: true },
  { id: 'q-scope', question: 'Are they accredited for your specific standard AND your industry sector?', critical: true },
  { id: 'q-verified', question: 'Have you verified their accreditation on IAF CertSearch or the national register?', critical: true },
  { id: 'q-impartial', question: 'Are they independent (did not consult on your system)?', critical: true },
  { id: 'q-days', question: 'Is the proposed number of audit days realistic for your size/scope?', critical: false },
  { id: 'q-experience', question: 'Do they have experience in your sector?', critical: false },
  { id: 'q-language', question: 'Can they audit in your language and region?', critical: false },
  { id: 'q-references', question: 'Have you checked references or reviews?', critical: false },
]

export const VERIFY_LINKS: { label: string; url: string; note: string }[] = [
  {
    label: 'IAF CertSearch',
    url: 'https://www.iafcertsearch.org',
    note: 'Global database to verify a certification body, its accreditation, and existing certificates.',
  },
]
