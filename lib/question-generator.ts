// AI question generator (for any standard / any document).
//
// WHY THIS EXISTS
// Hand-writing questionnaires for 26 standards would be thousands of questions.
// Instead the AI generates the question set for a document — but it is GROUNDED:
// it is told what the clause actually requires (from our own paraphrased clause
// library) and instructed to ask only what is needed to write that document.
//
// SAFEGUARDS (important for a compliance product):
//  1. Curated questions win. Where we have hand-written questions (ISO 9001
//     document types), those are used — they are higher quality and reviewed.
//  2. Grounded, not free-form. The prompt carries the clause requirements; the
//     AI may not invent obligations or claim ISO demands something it doesn't.
//  3. Marked. Generated sets are labelled so the user knows they are AI-built.
//  4. Consistent. Results are cached per (standard, document) so the same
//     document always asks the same questions — a documented system needs that.

export type GeneratedQuestion = {
  id: string
  label: string
  hint?: string
  kind: 'text' | 'textarea'
  placeholder?: string
}

export type QuestionSet = {
  documentType: string
  standard: string
  clauses: string[]
  questions: GeneratedQuestion[]
  source: 'curated' | 'ai'
}

/** Context we give the AI so it asks the right things. */
export type GroundingContext = {
  standard: string // "ISO 22000:2018"
  documentTitle: string // "HACCP plan"
  clauseRefs: string[] // ["8.5.2"]
  clauseRequirements: string[] // paraphrased, from OUR library
  expectedEvidence?: string[] // what an auditor would want to see
  industry?: string | null // company industry, to phrase questions concretely
  companySize?: string | null
}

export const SYSTEM_PROMPT = `You design short questionnaires that a small company answers so that an ISO document can be written from their real answers.

RULES — follow exactly:
1. Ask ONLY what is needed to write the named document. Nothing else.
2. Between 4 and 8 questions. Fewer is better than more.
3. Plain language for someone who knows NOTHING about ISO. No jargon, no clause numbers in the question text.
4. Every question must be answerable by a small-business owner from their own knowledge. Never ask them to interpret the standard.
5. Where a company might not know what is expected, add a short hint with a concrete example.
6. NEVER state or imply that the standard demands a specific frequency, format, or method that it does not. If a frequency is needed, ask for THEIR choice and THEIR reason.
7. Do not invent requirements. Base the questions only on the requirements supplied to you.
8. Do not reproduce any wording from the ISO standard itself.

OUTPUT: return ONLY a JSON array, no preamble, no markdown fences. Each item:
{"id":"short_snake_case","label":"the question","hint":"optional short hint with an example","kind":"text" or "textarea","placeholder":"optional example answer"}
Use "textarea" for questions expecting lists or several sentences, "text" for short answers.`

export function buildUserPrompt(ctx: GroundingContext): string {
  return `Document to be written: ${ctx.documentTitle}
Standard: ${ctx.standard}
Relevant clause reference(s) (for your understanding only — do not put them in the questions): ${ctx.clauseRefs.join(', ') || 'n/a'}

What these requirements actually ask of the company (paraphrased):
${ctx.clauseRequirements.map((r) => `- ${r}`).join('\n') || '- (general management-system requirement)'}

${ctx.expectedEvidence?.length ? `What an auditor would typically want to see:\n${ctx.expectedEvidence.map((e) => `- ${e}`).join('\n')}\n` : ''}
Company context: ${ctx.industry ? `industry: ${ctx.industry}. ` : ''}${ctx.companySize ? `size: ${ctx.companySize}.` : ''}

Write the questionnaire now as a JSON array.`
}

/** Parse and sanity-check the model output. Returns [] if unusable. */
export function parseQuestions(raw: string): GeneratedQuestion[] {
  let text = raw.trim()
  // strip accidental fences
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  // find the array if the model added stray text
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return []
  try {
    const arr = JSON.parse(text.slice(start, end + 1))
    if (!Array.isArray(arr)) return []
    const out: GeneratedQuestion[] = []
    for (const item of arr.slice(0, 10)) {
      if (!item || typeof item !== 'object') continue
      const label = typeof item.label === 'string' ? item.label.trim().slice(0, 300) : ''
      if (!label) continue
      const id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().replace(/[^a-z0-9_]/gi, '_').slice(0, 40)
          : `q_${out.length + 1}`
      out.push({
        id,
        label,
        hint: typeof item.hint === 'string' ? item.hint.trim().slice(0, 300) : undefined,
        kind: item.kind === 'textarea' ? 'textarea' : 'text',
        placeholder: typeof item.placeholder === 'string' ? item.placeholder.trim().slice(0, 200) : undefined,
      })
    }
    return out
  } catch {
    return []
  }
}
