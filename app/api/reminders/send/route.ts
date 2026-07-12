import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireUser, jsonError } from '@/lib/api/auth'
import { kindLabel, daysUntil } from '@/lib/reminders'

type ReminderRow = {
  id: string
  company_id: string
  title: string
  kind: string
  due_date: string
  notify_days_before: number
  status: string
  last_notified_at: string | null
}

const RENOTIFY_HOURS = 72 // re-send overdue/soon reminders at most every 3 days

function inNotifyWindow(r: ReminderRow): boolean {
  const d = daysUntil(r.due_date)
  return d <= r.notify_days_before // includes overdue (negative)
}

function recentlyNotified(r: ReminderRow): boolean {
  if (!r.last_notified_at) return false
  return Date.now() - new Date(r.last_notified_at).getTime() < RENOTIFY_HOURS * 3600_000
}

function digestHtml(companyName: string, rows: ReminderRow[]): string {
  const items = rows
    .map((r) => {
      const d = daysUntil(r.due_date)
      const when =
        d < 0 ? `<strong style="color:#b91c1c">${Math.abs(d)} day(s) overdue</strong>`
        : d === 0 ? '<strong>due today</strong>'
        : `due in ${d} day(s)`
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(r.title)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(kindLabel(r.kind))}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.due_date} · ${when}</td>
      </tr>`
    })
    .join('')
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
    <h2 style="font-size:16px">Lemma IMS — upcoming compliance deadlines</h2>
    <p>${escapeHtml(companyName)}: the following items need attention.</p>
    <table style="border-collapse:collapse;width:100%;max-width:640px">
      <tr>
        <th align="left" style="padding:6px 10px;border-bottom:2px solid #ddd">Item</th>
        <th align="left" style="padding:6px 10px;border-bottom:2px solid #ddd">Type</th>
        <th align="left" style="padding:6px 10px;border-bottom:2px solid #ddd">Due</th>
      </tr>
      ${items}
    </table>
    <p style="color:#666;font-size:12px">Open Lemma IMS → Reminders &amp; deadlines to mark items done or adjust dates.</p>
  </div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendEmail(to: string[], subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' }
  const from = process.env.REMINDER_FROM_EMAIL ?? 'Lemma IMS <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    return { ok: false, error: `Resend ${res.status}: ${t.slice(0, 200)}` }
  }
  return { ok: true }
}

/** Daily cron: Vercel calls GET with Authorization: Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return jsonError(401, 'Unauthorized')
  }

  const admin = createAdminClient()
  if (!admin) return jsonError(503, 'SUPABASE_SERVICE_ROLE_KEY is not set')

  const { data: rows, error } = await admin
    .from('reminders')
    .select('id, company_id, title, kind, due_date, notify_days_before, status, last_notified_at')
    .eq('status', 'open')
  if (error) return jsonError(500, error.message)

  const due = (rows ?? []).filter((r) => inNotifyWindow(r) && !recentlyNotified(r))
  if (due.length === 0) {
    return Response.json({ message: 'No reminders due for notification.' })
  }

  // Group by company
  const byCompany = new Map<string, ReminderRow[]>()
  for (const r of due) {
    const list = byCompany.get(r.company_id) ?? []
    list.push(r)
    byCompany.set(r.company_id, list)
  }

  let sent = 0
  const problems: string[] = []
  for (const [companyId, list] of Array.from(byCompany.entries())) {
    const [{ data: company }, { data: users }] = await Promise.all([
      admin.from('companies').select('name').eq('id', companyId).maybeSingle(),
      admin.from('users').select('email').eq('company_id', companyId),
    ])
    const emails = (users ?? []).map((u) => u.email).filter((e): e is string => Boolean(e))
    if (emails.length === 0) continue

    const result = await sendEmail(
      emails,
      `Lemma IMS: ${list.length} compliance deadline(s) need attention`,
      digestHtml(company?.name ?? 'Your company', list)
    )
    if (result.ok) {
      sent++
      await admin
        .from('reminders')
        .update({ last_notified_at: new Date().toISOString() })
        .in('id', list.map((r: ReminderRow) => r.id))
    } else if (result.error) {
      problems.push(result.error)
    }
  }

  return Response.json({
    message: `Digests sent for ${sent} company(ies).`,
    ...(problems.length > 0 ? { problems } : {}),
  })
}

/** Manual: signed-in user emails themselves their company's due reminders. */
export async function POST() {
  const auth = await requireUser()
  if (!auth.ok) return jsonError(auth.status, auth.error)

  const supabase = createClient()
  const [{ data: rows, error }, { data: me }, { data: company }] = await Promise.all([
    supabase
      .from('reminders')
      .select('id, company_id, title, kind, due_date, notify_days_before, status, last_notified_at')
      .eq('company_id', auth.companyId)
      .eq('status', 'open'),
    supabase.from('users').select('email').eq('id', auth.userId).maybeSingle(),
    supabase.from('companies').select('name').eq('id', auth.companyId).maybeSingle(),
  ])
  if (error) return jsonError(500, error.message)
  if (!me?.email) return jsonError(400, 'Your account has no email on file.')

  const open = rows ?? []
  if (open.length === 0) return Response.json({ message: 'No open reminders to send.' })

  const result = await sendEmail(
    [me.email],
    `Lemma IMS: your ${open.length} open reminder(s)`,
    digestHtml(company?.name ?? 'Your company', open)
  )
  if (!result.ok) {
    return jsonError(
      503,
      result.error?.includes('RESEND_API_KEY')
        ? 'Email is not configured yet — add RESEND_API_KEY in Vercel (see deploy notes).'
        : result.error ?? 'Email failed'
    )
  }
  return Response.json({ message: `Sent to ${me.email}.` })
}
