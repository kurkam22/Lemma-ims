import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM = `You are an ISO 9001 management review facilitator. Given a company's current QMS data, produce a focused, practical management review agenda. The agenda must cover the standard's required inputs (clause 9.3): status of actions from previous reviews, changes in external/internal issues, customer satisfaction and feedback, quality objectives performance, process performance and product conformity, nonconformities and corrective actions, audit results, performance of external providers, resource adequacy, effectiveness of actions taken to address risks and opportunities, and opportunities for improvement.

Output a numbered agenda in plain markdown. For each item, include a one-line note that references the data provided (e.g. "3 open CAPAs, 1 overdue"). Keep the tone direct and useful for a leadership meeting — no fluff.`

export async function POST(req: Request) {
  let body: { data?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ agenda: fallbackAgenda(body.data ?? {}) })
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Generate the management review agenda from this data:\n\n${JSON.stringify(body.data ?? {}, null, 2)}`,
        },
      ],
    })
    const block = msg.content.find((b) => b.type === 'text')
    const text = block && block.type === 'text' ? block.text : ''
    return NextResponse.json({ agenda: text.trim() })
  } catch (e) {
    console.error('Claude agenda failed:', e)
    return NextResponse.json({ agenda: fallbackAgenda(body.data ?? {}) })
  }
}

function fallbackAgenda(data: Record<string, unknown>): string {
  return `# Management Review Agenda

1. **Status of actions from previous reviews** — review carry-overs.
2. **Changes affecting the QMS** — internal/external issues since last review.
3. **Customer satisfaction and feedback** — complaints, NPS, returns.
4. **Quality objectives performance** — ${JSON.stringify(data.objectives ?? '—')}.
5. **Process performance and product conformity** — KPIs by process.
6. **Nonconformities and corrective actions** — CAPA status: ${JSON.stringify(data.capa_status ?? '—')}.
7. **Audit results** — internal audit findings: ${JSON.stringify(data.audit_status ?? '—')}.
8. **Performance of external providers** — supplier average score: ${JSON.stringify(data.supplier_avg_score ?? '—')}.
9. **Resource adequacy** — review manual input.
10. **Risks and opportunities** — effectiveness of treatments.
11. **Opportunities for improvement** — review manual input.
12. **Decisions and actions** — owner and deadline per action.`
}
