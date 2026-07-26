import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { requireUser, jsonError } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { QUESTIONNAIRES } from '@/lib/questionnaires'
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseQuestions,
  type GroundingContext,
  type QuestionSet,
} from '@/lib/question-generator'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'
import { DOC_SETS } from '@/lib/required-documents'

export const maxDuration = 45

type Body = {
  documentTitle?: string
  standard?: string
  clauseRefs?: string[]
  /** plain-language requirement lines; if omitted we look them up for ISO 9001 */
  requirements?: string[]
}

/**
 * Pull paraphrased requirements from OUR OWN libraries (never ISO text).
 * Works across every standard we cover: the deep ISO 9001 clause library,
 * plus the per-standard required-document sets (14001, 45001, 22000, 27001…),
 * each of which carries a clause reference and a plain-language reason.
 */
function lookupRequirements(
  clauseRefs: string[],
  standard: string,
  documentTitle: string
): { reqs: string[]; evidence: string[] } {
  const reqs: string[] = []
  const evidence: string[] = []

  // 1) ISO 9001 deep clause library (richest grounding)
  if (/9001/.test(standard)) {
    for (const ref of clauseRefs) {
      const c = ISO_9001_CLAUSES.find((x) => x.number === ref || ref.startsWith(x.number + '.'))
      if (c) {
        reqs.push(`${c.title}: ${c.plain}`)
        if (c.evidence) evidence.push(c.evidence)
      }
    }
  }

  // 2) Any standard: match the document in that standard's required-document set
  const wanted = documentTitle.toLowerCase()
  for (const set of DOC_SETS) {
    const label = set.standardLabel.toLowerCase()
    const code = set.standardId.replace('iso-', '')
    if (!standard.toLowerCase().includes(code) && !label.includes(standard.toLowerCase().slice(0, 8))) continue
    for (const d of set.docs) {
      const title = d.title.toLowerCase()
      const iso = (d.isoTitle ?? '').toLowerCase()
      const match =
        title === wanted ||
        iso === wanted ||
        title.includes(wanted) ||
        wanted.includes(title) ||
        (iso && (iso.includes(wanted) || wanted.includes(iso)))
      if (match) {
        reqs.push(`${d.isoTitle ?? d.title} (${d.clauseRef}): ${d.why}`)
        evidence.push(
          d.kind === 'retain'
            ? `Records showing this actually happens (${d.clauseRef})`
            : `A current, approved ${d.title.toLowerCase()} (${d.clauseRef})`
        )
      }
    }
  }

  return { reqs: reqs.slice(0, 8), evidence: evidence.slice(0, 6) }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) return jsonError(auth.status, auth.error)

  const rl = await checkRateLimit(auth.userId, 'questions')
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonError(400, 'Invalid JSON')
  }

  const documentTitle = (body.documentTitle ?? '').trim().slice(0, 200)
  const standard = (body.standard ?? 'ISO 9001:2015').trim().slice(0, 60)
  const clauseRefs = (body.clauseRefs ?? []).slice(0, 8).map((c) => String(c).slice(0, 12))
  if (!documentTitle) return jsonError(400, 'documentTitle is required')

  // 1) Curated questions win — reviewed, higher quality, consistent.
  const curated = QUESTIONNAIRES[documentTitle]
  if (curated && curated.length > 0) {
    const set: QuestionSet = {
      documentType: documentTitle,
      standard,
      clauses: clauseRefs,
      source: 'curated',
      questions: curated.map((q) => ({
        id: q.id,
        label: q.label,
        hint: q.hint,
        kind: q.kind,
        placeholder: q.placeholder,
      })),
    }
    return Response.json(set)
  }

  // 2) Otherwise generate — grounded in our clause library + company context.
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return jsonError(503, 'AI is not configured (ANTHROPIC_API_KEY missing).')

  const supabase = createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('industry, employee_count')
    .eq('id', auth.companyId)
    .maybeSingle()

  const looked = lookupRequirements(clauseRefs, standard, documentTitle)
  const ctx: GroundingContext = {
    standard,
    documentTitle,
    clauseRefs,
    clauseRequirements: (body.requirements ?? []).slice(0, 12).map((r) => String(r).slice(0, 400)).concat(looked.reqs),
    expectedEvidence: looked.evidence,
    industry: company?.industry ?? null,
    companySize: company?.employee_count ? String(company.employee_count) : null,
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(ctx) }],
    })
    const text = msg.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()

    const questions = parseQuestions(text)
    if (questions.length === 0) {
      return jsonError(502, 'Could not build questions for this document — try again.')
    }

    const set: QuestionSet = {
      documentType: documentTitle,
      standard,
      clauses: clauseRefs,
      source: 'ai',
      questions,
    }
    return Response.json(set)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'AI request failed'
    return jsonError(502, message.slice(0, 200))
  }
}
