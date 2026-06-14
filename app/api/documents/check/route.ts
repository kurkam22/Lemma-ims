import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { STANDARDS } from '@/lib/iso-clauses'

export const maxDuration = 60

/**
 * POST /api/documents/check
 *
 * Checks a document's text against ISO clause requirements, clause by
 * clause, and returns a structured gap analysis the user can act on.
 *
 * Body: {
 *   documentText: string            // the document to check
 *   standard?: 'iso9001' | 'iso14001' | 'iso45001'   // default iso9001
 *   clauses?: string[]              // e.g. ["5.2","6.1"]; default = all
 * }
 *
 * Response: {
 *   results: Array<{
 *     clause: string
 *     title: string
 *     status: 'covered' | 'partial' | 'missing' | 'not_applicable'
 *     evidence: string      // short quote/reference from the user's own document
 *     gaps: string          // what is missing, plainly
 *     recommendation: string
 *   }>
 *   summary: { covered: number; partial: number; missing: number; not_applicable: number }
 * }
 */

const MAX_DOC_CHARS = 60_000
const MAX_CLAUSES_PER_CALL = 12

const SYSTEM_PROMPT = `You are an ISO compliance auditor for Lemma IMS. You receive (a) a list of ISO clause requirements and (b) the full text of a company's document. Your job is to assess, for each clause, whether the document addresses it.

Rules:
1. Judge ONLY from the document text provided. Do not assume things exist that are not written.
2. Status meanings:
   - "covered": the document clearly and substantively addresses the clause requirement.
   - "partial": the clause is mentioned or partially addressed but key elements are missing, vague, or marked as placeholders like [TO CONFIRM].
   - "missing": the document does not address the clause.
   - "not_applicable": the clause is clearly outside this document's purpose (e.g. checking a training procedure against the supplier clause).
3. "evidence" must be a short reference to the user's own document — quote at most ~20 words from it or name the exact section heading. Empty string if status is "missing".
4. "gaps" states concretely what an auditor would flag. Empty string if fully covered.
5. "recommendation" is one practical sentence on what to add or fix. Empty string if fully covered.
6. Be strict but fair — this is preparation for a real certification audit. Vague intentions ("we aim to be good at quality") do not satisfy requirements that demand defined processes, records, or responsibilities.
7. Respond with a JSON object ONLY. No prose, no markdown fences. Schema:
{"results":[{"clause":"5.2","status":"covered|partial|missing|not_applicable","evidence":"...","gaps":"...","recommendation":"..."}]}`

type CheckResult = {
  clause: string
  title: string
  status: 'covered' | 'partial' | 'missing' | 'not_applicable'
  evidence: string
  gaps: string
  recommendation: string
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const rl = await checkRateLimit(auth.userId, 'check')
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: {
    documentText?: string
    standard?: string
    clauses?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const documentText = (body.documentText ?? '').trim()
  if (documentText.length < 50) {
    return NextResponse.json(
      { error: 'documentText is required (min 50 characters)' },
      { status: 400 }
    )
  }
  if (documentText.length > MAX_DOC_CHARS) {
    return NextResponse.json(
      {
        error: `Document too long (${documentText.length} chars, max ${MAX_DOC_CHARS}). Split it and check sections separately.`,
      },
      { status: 400 }
    )
  }

  const standard =
    STANDARDS.find((s) => s.shortCode === (body.standard ?? 'iso9001')) ??
    STANDARDS[0]
  if (standard.clauses.length === 0) {
    return NextResponse.json(
      { error: `${standard.code} clause library is not loaded yet.` },
      { status: 400 }
    )
  }

  const requested =
    Array.isArray(body.clauses) && body.clauses.length > 0
      ? standard.clauses.filter((c) => body.clauses!.includes(c.number))
      : standard.clauses

  if (requested.length === 0) {
    return NextResponse.json(
      { error: 'No matching clauses for this standard' },
      { status: 400 }
    )
  }
  if (requested.length > MAX_CLAUSES_PER_CALL) {
    return NextResponse.json(
      {
        error: `Too many clauses (${requested.length}, max ${MAX_CLAUSES_PER_CALL} per check). Run it in batches.`,
      },
      { status: 400 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
      { status: 503 }
    )
  }

  const clauseBlock = requested
    .map(
      (c) =>
        `Clause ${c.number} — ${c.title} (${standard.code})\nRequirement in plain terms: ${c.plain}\nTypical document expected: ${c.document}\nTypical evidence expected: ${c.evidence}`
    )
    .join('\n\n')

  const userPrompt = `CLAUSES TO CHECK:\n\n${clauseBlock}\n\n=====\nDOCUMENT TEXT:\n"""\n${documentText}\n"""\n\nAssess each clause now. JSON only.`

  const anthropic = new Anthropic({ apiKey })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const block = msg.content.find((b) => b.type === 'text')
    const text = block && block.type === 'text' ? block.text : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    const parsed = JSON.parse(cleaned) as { results?: unknown[] }

    const byNumber = new Map(requested.map((c) => [c.number, c]))
    const valid = new Set(['covered', 'partial', 'missing', 'not_applicable'])

    const results: CheckResult[] = (parsed.results ?? [])
      .map((r) => {
        const row = r as Record<string, unknown>
        const clause = String(row.clause ?? '')
        const meta = byNumber.get(clause)
        if (!meta) return null
        const status = valid.has(String(row.status))
          ? (String(row.status) as CheckResult['status'])
          : 'partial'
        return {
          clause,
          title: meta.title,
          status,
          evidence: String(row.evidence ?? ''),
          gaps: String(row.gaps ?? ''),
          recommendation: String(row.recommendation ?? ''),
        }
      })
      .filter((r): r is CheckResult => r !== null)

    // Any clause the model skipped is reported as unassessed-missing
    for (const c of requested) {
      if (!results.some((r) => r.clause === c.number)) {
        results.push({
          clause: c.number,
          title: c.title,
          status: 'missing',
          evidence: '',
          gaps: 'Not assessed by the model — treat as unverified.',
          recommendation: 'Re-run the check for this clause.',
        })
      }
    }

    results.sort((a, b) =>
      a.clause.localeCompare(b.clause, undefined, { numeric: true })
    )

    const summary = {
      covered: results.filter((r) => r.status === 'covered').length,
      partial: results.filter((r) => r.status === 'partial').length,
      missing: results.filter((r) => r.status === 'missing').length,
      not_applicable: results.filter((r) => r.status === 'not_applicable')
        .length,
    }

    return NextResponse.json({ results, summary, standard: standard.code })
  } catch (e) {
    console.error('Compliance check failed:', e)
    return NextResponse.json(
      { error: 'Compliance check failed. Please try again.' },
      { status: 502 }
    )
  }
}
