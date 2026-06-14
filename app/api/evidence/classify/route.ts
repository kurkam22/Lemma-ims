import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'

const SYSTEM_PROMPT = `You are a classifier for ISO 9001 evidence files. Given a filename (and, when available, an excerpt of the file's text content), classify the evidence type and identify which ISO 9001 clauses it likely relates to. When content is provided, weight it more heavily than the filename.

ISO 9001 clauses and what they cover:
4.1 Context, 4.2 Interested parties, 4.3 Scope, 4.4 Processes, 5.2 Quality policy, 6.1 Risks, 6.2 Objectives, 7.2 Competence, 7.3 Awareness, 7.4 Communication, 7.5 Documents, 8.1 Operations, 8.2 Customer requirements, 8.4 Suppliers, 8.5 Production, 9.1 Monitoring, 9.2 Internal audit, 9.3 Management review, 10.2 CAPA, 10.3 Improvement.

Evidence types: Policy, Procedure, Record, Certificate, Training record, Audit report, Risk register, Other.

Respond with a JSON object only, no prose, no markdown fences. Schema:
{
  "evidence_type": one of the types above,
  "clauses": array of ISO 9001 clause numbers like "4.1", "8.4" (empty array if uncertain),
  "confidence": "high" | "medium" | "low"
}`

const MAX_FILENAME_LEN = 300
const MAX_EXCERPT_LEN = 4000

export async function POST(req: Request) {
  // Auth: this route spends Anthropic credits — never expose it publicly.
  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const rl = await checkRateLimit(auth.userId, 'classify')
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: { fileName?: string; textExcerpt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const fileName = body.fileName
  if (!fileName || typeof fileName !== 'string') {
    return NextResponse.json({ error: 'fileName required' }, { status: 400 })
  }
  if (fileName.length > MAX_FILENAME_LEN) {
    return NextResponse.json({ error: 'fileName too long' }, { status: 400 })
  }

  const excerpt =
    typeof body.textExcerpt === 'string'
      ? body.textExcerpt.slice(0, MAX_EXCERPT_LEN)
      : null

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(heuristic(fileName))
  }

  const anthropic = new Anthropic({ apiKey })

  const userContent = excerpt
    ? `Classify this evidence file.\nFilename: "${fileName}"\nContent excerpt:\n"""\n${excerpt}\n"""`
    : `Classify this evidence file: "${fileName}"`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textBlock = msg.content.find((b) => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')

    const parsed = JSON.parse(cleaned)
    return NextResponse.json({
      evidence_type:
        typeof parsed.evidence_type === 'string' ? parsed.evidence_type : 'Other',
      clauses: Array.isArray(parsed.clauses) ? parsed.clauses : [],
      confidence:
        typeof parsed.confidence === 'string' ? parsed.confidence : 'medium',
    })
  } catch (e) {
    console.error('Claude classification failed:', e)
    return NextResponse.json(heuristic(fileName))
  }
}

function heuristic(fileName: string) {
  const name = fileName.toLowerCase()
  let evidence_type = 'Other'
  if (/policy/.test(name)) evidence_type = 'Policy'
  else if (/procedure|sop/.test(name)) evidence_type = 'Procedure'
  else if (/training|competence/.test(name)) evidence_type = 'Training record'
  else if (/audit/.test(name)) evidence_type = 'Audit report'
  else if (/risk/.test(name)) evidence_type = 'Risk register'
  else if (/cert/.test(name)) evidence_type = 'Certificate'
  else if (/record|log/.test(name)) evidence_type = 'Record'
  return { evidence_type, clauses: [] as string[], confidence: 'low' as const }
}
