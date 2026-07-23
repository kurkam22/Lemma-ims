import { createClient } from '@/lib/supabase/server'
import { requireUser, jsonError } from '@/lib/api/auth'
import { buildDocx, buildXlsx, safeFilename, type ExportMeta } from '@/lib/export-engine'

type Body = {
  content?: string
  format?: 'docx' | 'xlsx'
  meta?: ExportMeta
  // if email is present, send instead of download
  email?: string
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachment: { filename: string; content: string }
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' }
  const from = process.env.REMINDER_FROM_EMAIL ?? 'Lemma IMS <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments: [{ filename: attachment.filename, content: attachment.content }],
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    return { ok: false, error: `Resend ${res.status}: ${t.slice(0, 160)}` }
  }
  return { ok: true }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) return jsonError(auth.status, auth.error)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonError(400, 'Invalid JSON')
  }

  const content = (body.content ?? '').slice(0, 200_000)
  const format = body.format === 'xlsx' ? 'xlsx' : 'docx'
  const meta: ExportMeta = {
    title: body.meta?.title?.slice(0, 200) || 'Document',
    companyName: body.meta?.companyName ?? null,
    standard: body.meta?.standard,
    clauses: body.meta?.clauses,
    status: body.meta?.status,
    documentCode: body.meta?.documentCode ?? null,
  }
  if (!content.trim()) return jsonError(400, 'Nothing to export')

  // Fill company name from the account if not provided
  if (!meta.companyName) {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('name')
      .eq('id', auth.companyId)
      .maybeSingle()
    meta.companyName = data?.name ?? null
  }

  const buffer =
    format === 'xlsx' ? buildXlsx(content, meta) : await buildDocx(content, meta)
  const filename = safeFilename(meta.title, meta.documentCode, format)

  // Email path
  if (body.email) {
    const email = body.email.trim().slice(0, 200)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError(400, 'Invalid email address')
    const statusTag = (meta.status ?? 'DRAFT').toUpperCase()
    const result = await sendEmail(
      email,
      `${meta.title} (${statusTag}) — from Lemma IMS`,
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <p>Attached: <strong>${meta.title}</strong> (${statusTag}).</p>
        <p style="color:#666;font-size:12px">${meta.companyName ?? ''} · ${meta.standard ?? ''} ${meta.clauses ? '· clause ' + meta.clauses : ''}</p>
        <p style="color:#666;font-size:12px">This is an AI-assisted draft and requires human review before use in certification.</p>
      </div>`,
      { filename, content: buffer.toString('base64') }
    )
    if (!result.ok) {
      return jsonError(
        503,
        result.error?.includes('RESEND_API_KEY')
          ? 'Email is not set up yet — add RESEND_API_KEY in Vercel.'
          : `Could not send: ${result.error}`
      )
    }
    return Response.json({ message: `Sent to ${email}.` })
  }

  // Download path
  const contentType =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
