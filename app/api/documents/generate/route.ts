import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { requireUser, jsonError } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an ISO 9001 compliance document writer for Lemma IMS, an AI-assisted ISO compliance platform.

Your task: draft an ISO 9001 compliance document for a real company based ONLY on the confirmed data they provide.

Absolute rules (these are non-negotiable):
1. Use ONLY the data in the provided company object. Never invent facts, names, dates, numbers, or signatures. If you don't have it, write the literal placeholder: [TO CONFIRM]
2. Write in the language given by company.document_language ("EN", "RU", or "UZ"). Default to English if unset.
3. Start every document with a control header:
   Company: {company.name or [TO CONFIRM]}
   Document code: [TO CONFIRM]   (the user fills this in on save)
   Version: 1.0
   Date: {today, ISO format}
   Owner: {qms_manager_name or [TO CONFIRM]}
4. Number sections clearly. Reference ISO 9001 clauses where directly applicable (e.g. "Aligned with ISO 9001:2015 clause 8.4").
5. Output the document content directly. No preamble like "Here is your document". No commentary at the end.
6. Plain, audit-ready language. Short sentences. No corporate filler. No marketing tone.
7. If a section depends on data you don't have, write the section heading then explicitly say which data is missing using [TO CONFIRM: what is needed].

DOCUMENT STRUCTURE BY TYPE:

IMS Policy:
  1. Purpose
  2. Scope (which products/services, which sites)
  3. Policy statement (top-management commitment)
  4. Commitments (customer focus, continual improvement, compliance with legal/regulatory requirements)
  5. Communication and review
  6. Approval (signed by Director — use [TO CONFIRM] for signature)

Quality procedure:
  1. Purpose
  2. Scope
  3. Responsibilities
  4. Procedure steps (numbered, each with inputs/actions/outputs)
  5. Records produced
  6. References to other procedures

Risk register:
  1. Purpose (clause 6.1)
  2. Scope
  3. Methodology (likelihood × impact, 5×5 matrix, treatment options Avoid/Reduce/Transfer/Accept)
  4. Risk register table (header row: ID | Description | Process | Clause | Likelihood | Impact | Level | Treatment | Owner | Review date | Status — then template rows from data if available, else mark with [TO CONFIRM])
  5. Review schedule

Supplier evaluation procedure (clause 8.4):
  1. Purpose
  2. Scope
  3. Selection criteria
  4. Evaluation process (initial qualification, ongoing performance review)
  5. Approval and approved supplier list maintenance
  6. Monitoring and re-evaluation

CAPA procedure (clause 10.2):
  1. Purpose
  2. Scope
  3. Initiation (sources, who can raise, recording)
  4. Root cause analysis (5 Whys, fishbone, or similar)
  5. Corrective action (immediate vs permanent)
  6. Verification of effectiveness
  7. Closure

Internal audit procedure (clause 9.2):
  1. Purpose
  2. Scope
  3. Audit programme (frequency, planning)
  4. Audit execution (preparation, opening meeting, evidence gathering, closing meeting)
  5. Reporting (findings classification: NC, observation, conformant)
  6. Follow-up (CAPA linkage)

Training procedure (clauses 7.2, 7.3):
  1. Purpose
  2. Scope
  3. Needs identification (competence matrix, gaps)
  4. Training delivery
  5. Evaluation of effectiveness
  6. Records

Management review procedure (clause 9.3):
  1. Purpose
  2. Scope and frequency
  3. Inputs (the 11 standard inputs from clause 9.3.2)
  4. Review meeting agenda and attendees
  5. Outputs (decisions, actions, resource needs)
  6. Documentation (minutes, action tracking)

Competence matrix:
  Header with company info, then a table: rows = roles (or named employees if provided), columns = required competences. Cells marked Required/Achieved/[TO CONFIRM].

Process card:
  Single-process specification:
  - Process name
  - Owner (role)
  - Participants
  - Purpose
  - Inputs
  - Outputs
  - Steps (numbered)
  - KPIs and measurement
  - Records produced

Approved supplier list:
  Header, then a table: Supplier | Product/service | Criticality | Approval status | Cert expiry | Next review date | Notes. Use rows from supplier data if provided, else template row with [TO CONFIRM].
`

export async function POST(req: Request) {
  let body: { documentType?: string; companyId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { documentType, companyId } = body
  if (!documentType || !companyId) {
    return new Response(
      JSON.stringify({ error: 'documentType and companyId are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const auth = await requireUser(companyId)
  if (!auth.ok) {
    return jsonError(auth.status, auth.error)
  }

  const rl = await checkRateLimit(auth.userId, 'generate')
  if (!rl.allowed) return rateLimitResponse(rl)

  const supabase = createClient()

  const COMPANY_PROMPT_COLUMNS =
    'name, industry, country, certification_goal, document_language, ' +
    'target_date, employee_count, director_name, qms_manager_name, ' +
    'department_heads, sites, consultant_name, processes, ' +
    'quality_objectives, document_code_prefix'

  const { data: company } = await supabase
    .from('companies')
    .select(COMPANY_PROMPT_COLUMNS)
    .eq('id', companyId)
    .maybeSingle()
  if (!company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const anthropic = new Anthropic({ apiKey })

  const userPrompt = `Today's date: ${new Date().toISOString().slice(0, 10)}

Document type to generate: ${documentType}

Company data (only confirmed fields — anything else must be [TO CONFIRM]):
${JSON.stringify(
    Object.fromEntries(
      Object.entries(company).filter(([, v]) => v !== null && v !== '')
    ),
    null,
    2
  )}

Generate the document now.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Generation failed'
        controller.enqueue(encoder.encode(`\n\n[ERROR: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
