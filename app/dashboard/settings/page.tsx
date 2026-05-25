'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  department: string | null
  notification_prefs: { email_reminders?: boolean }
}

type Company = {
  id: string
  name: string
  interface_language: string | null
  document_language: string | null
  document_code_prefix: string | null
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [me, setMe] = useState<UserRow | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: meRow } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
      if (!meRow?.company_id) { setLoading(false); return }
      const [usersRes, companyRes] = await Promise.all([
        supabase.from('users').select('*').eq('company_id', meRow.company_id).order('created_at'),
        supabase.from('companies').select('id, name, interface_language, document_language, document_code_prefix').eq('id', meRow.company_id).maybeSingle(),
      ])
      if (cancelled) return
      setMe(normaliseUser(meRow))
      setUsers((usersRes.data ?? []).map(normaliseUser))
      setCompany(companyRes.data as Company)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function updateUserRole(id: string, role: string) {
    const supabase = createClient()
    const { error: e } = await supabase.from('users').update({ role }).eq('id', id)
    if (e) { setError(e.message); return }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  async function toggleEmailReminders(checked: boolean) {
    if (!me) return
    const supabase = createClient()
    const prefs = { ...me.notification_prefs, email_reminders: checked }
    const { error: e } = await supabase.from('users').update({ notification_prefs: prefs }).eq('id', me.id)
    if (e) { setError(e.message); return }
    setMe({ ...me, notification_prefs: prefs })
  }

  async function updateCompany(patch: Partial<Company>) {
    if (!company) return
    const supabase = createClient()
    const { error: e } = await supabase.from('companies').update(patch).eq('id', company.id)
    if (e) { setError(e.message); return }
    setCompany({ ...company, ...patch })
  }

  async function exportAllData() {
    if (!company) return
    setExporting(true)
    setNotice(null)
    setError(null)
    const supabase = createClient()
    const cid = company.id
    const tables = ['companies', 'users', 'documents', 'gap_answers', 'evidence', 'capas', 'suppliers', 'risks', 'audits', 'audit_findings', 'trainings', 'management_reviews', 'consultant_reviews', 'reports', 'activity_log']
    const data: Record<string, unknown> = {}
    for (const t of tables) {
      try {
        const q = t === 'companies'
          ? supabase.from(t).select('*').eq('id', cid)
          : supabase.from(t).select('*').eq('company_id', cid)
        const { data: rows } = await q
        data[t] = rows ?? []
      } catch (e) {
        data[t] = { error: String(e) }
      }
    }
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), company_id: cid, ...data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `lemma-export-${cid}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
    setExporting(false)
    setNotice('Export downloaded.')
  }

  function openStripePortal() {
    setNotice('Stripe customer portal is not yet wired up. Add STRIPE_SECRET_KEY and a /api/stripe/portal route to enable it.')
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>
  if (!company || !me) return <div className="text-sm text-gray-500">Could not load settings.</div>

  const codePreview = `${(company.document_code_prefix ?? 'DOC').toUpperCase()}-001`

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Workspace, billing, and your personal preferences.</p>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">{notice}</div>}

      <Section title="Users and access" description="Everyone in your workspace and what they can do.">
        <InviteForm onInvite={(email) => setNotice(`Invite for ${email} would be sent — wire up your transactional email provider (e.g. Resend) to send the invite link.`)} />
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-gray-900">{u.full_name ?? '—'} {u.id === me.id && <span className="text-[10px] text-blue-600 ml-1">(you)</span>}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{u.department ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white capitalize">
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Notification preferences" description="Choose what you get emailed about.">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!me.notification_prefs.email_reminders} onChange={e => toggleEmailReminders(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Email me reminders about upcoming deadlines, expiring evidence, and overdue CAPAs.</span>
        </label>
      </Section>

      <Section title="Document coding system" description="Prefix used when generating document codes. Codes look like DOC-001.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
            <input value={company.document_code_prefix ?? ''} onChange={e => updateCompany({ document_code_prefix: e.target.value })} className={inputCls} placeholder="DOC" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
            <div className={`${inputCls} bg-gray-50 font-mono`}>{codePreview}</div>
          </div>
        </div>
      </Section>

      <Section title="Language preferences" description="Interface and document language defaults.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Interface language</label>
            <select value={company.interface_language ?? 'EN'} onChange={e => updateCompany({ interface_language: e.target.value })} className={inputCls}>
              {['EN', 'RU', 'UZ'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document language</label>
            <select value={company.document_language ?? 'EN'} onChange={e => updateCompany({ document_language: e.target.value })} className={inputCls}>
              {['EN', 'RU', 'UZ'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Subscription" description="Your current plan and billing.">
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Starter (free trial)</div>
            <div className="text-xs text-gray-500 mt-0.5">Add a Stripe key to upgrade and unlock unlimited documents.</div>
          </div>
          <button type="button" onClick={openStripePortal} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Manage billing</button>
        </div>
      </Section>

      <Section title="Export all data" description="Download a JSON export of everything in your workspace. Use for GDPR data portability requests.">
        <button type="button" onClick={exportAllData} disabled={exporting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">{exporting ? 'Exporting…' : 'Export all data (JSON)'}</button>
      </Section>
    </div>
  )
}

function normaliseUser(row: unknown): UserRow {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name ?? null,
    role: row.role ?? 'member',
    department: row.department ?? null,
    notification_prefs: row.notification_prefs ?? { email_reminders: true },
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-xs text-gray-500 mt-0.5 mb-4">{description}</p>}
      {!description && <div className="mb-2" />}
      {children}
    </div>
  )
}

function InviteForm({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); if (email.trim()) { onInvite(email.trim()); setEmail('') } }} className="flex gap-2">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" className={inputCls} />
      <button type="submit" disabled={!email.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap">Invite</button>
    </form>
  )
}
