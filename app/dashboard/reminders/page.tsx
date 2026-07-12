'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REMINDER_KINDS, kindLabel, daysUntil, type Reminder } from '@/lib/reminders'

export default function RemindersPage() {
  const supabase = createClient()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [items, setItems] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // add form
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('custom')
  const [dueDate, setDueDate] = useState('')
  const [notifyDays, setNotifyDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const load = useCallback(async (cid: string) => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('company_id', cid)
      .order('due_date', { ascending: true })
    if (error) {
      setError(
        error.message.includes('relation')
          ? 'The reminders table does not exist yet — run migration_reminders.sql in Supabase (SQL Editor), then refresh.'
          : error.message
      )
      return
    }
    setItems((data ?? []) as Reminder[])
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase
        .from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      setCompanyId(userRow.company_id)
      await load(userRow.company_id)
      setLoading(false)
    })()
  }, [supabase, load])

  async function addReminder() {
    if (!companyId || !title.trim() || !dueDate) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('reminders').insert({
      company_id: companyId,
      title: title.trim(),
      kind,
      due_date: dueDate,
      notify_days_before: notifyDays,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setTitle(''); setDueDate(''); setKind('custom'); setNotifyDays(7)
    await load(companyId)
  }

  async function setStatus(id: string, status: 'open' | 'done') {
    if (!companyId) return
    await supabase.from('reminders').update({ status }).eq('id', id)
    await load(companyId)
  }

  async function remove(id: string) {
    if (!companyId) return
    await supabase.from('reminders').delete().eq('id', id)
    await load(companyId)
  }

  async function emailMeNow() {
    setSendingTest(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/reminders/send', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setError(j.error ?? `Failed (${res.status})`)
      else setNotice(j.message ?? 'Email sent.')
    } catch {
      setError('Could not reach the reminder service.')
    }
    setSendingTest(false)
  }

  const open = items.filter((i) => i.status === 'open')
  const done = items.filter((i) => i.status === 'done')

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reminders &amp; deadlines</h1>
          <p className="text-sm text-gray-500 mt-1">
            Certification is a calendar: audits, document reviews, corrective-action due dates.
            Lemma emails you before each deadline so nothing is missed.
          </p>
        </div>
        <button
          type="button"
          onClick={emailMeNow}
          disabled={sendingTest || open.length === 0}
          className="text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-md px-3 py-1.5"
        >
          {sendingTest ? 'Sending…' : 'Email me my reminders now'}
        </button>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">{notice}</div>}

      {/* Add form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Add a reminder</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label htmlFor="r-title" className="block text-xs font-medium text-gray-700">What is due?</label>
            <input id="r-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Surveillance audit, Review supplier procedure, Close CAPA-003"
              className="mt-1 w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="r-kind" className="block text-xs font-medium text-gray-700">Type</label>
            <select id="r-kind" value={kind} onChange={(e) => setKind(e.target.value)}
              className="mt-1 w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
              {REMINDER_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-date" className="block text-xs font-medium text-gray-700">Due date</label>
              <input id="r-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-md px-3 py-1.5" />
            </div>
            <div>
              <label htmlFor="r-notify" className="block text-xs font-medium text-gray-700">Notify (days before)</label>
              <input id="r-notify" type="number" min={0} max={60} value={notifyDays}
                onChange={(e) => setNotifyDays(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                className="mt-1 w-full text-sm border border-gray-300 rounded-md px-3 py-1.5" />
            </div>
          </div>
        </div>
        <button type="button" onClick={addReminder} disabled={saving || !title.trim() || !dueDate}
          className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-1.5 rounded-md">
          {saving ? 'Adding…' : 'Add reminder'}
        </button>
      </div>

      {/* Open list */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-800">Upcoming ({open.length})</div>
        {loading && <div className="text-sm text-gray-400">Loading…</div>}
        {!loading && open.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
            No reminders yet. Add your first one above — a good start is your next
            internal audit date or your certificate&apos;s surveillance-audit anniversary.
          </div>
        )}
        {open.map((r) => {
          const d = daysUntil(r.due_date)
          const overdue = d < 0
          const soon = d >= 0 && d <= r.notify_days_before
          return (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{r.title}</span>
                  <span className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{kindLabel(r.kind)}</span>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${
                    overdue ? 'text-red-700 bg-red-50 border-red-200'
                    : soon ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                    {overdue ? `${Math.abs(d)}d overdue` : d === 0 ? 'today' : `in ${d}d`} · {r.due_date}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setStatus(r.id, 'done')}
                  className="text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 rounded-md px-3 py-1.5">
                  Mark done
                </button>
                <button type="button" onClick={() => remove(r.id)}
                  className="text-xs font-medium text-gray-500 border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1.5">
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-400">Done ({done.length})</div>
          {done.map((r) => (
            <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-3">
              <span className="text-sm text-gray-400 line-through flex-1 min-w-0 truncate">{r.title}</span>
              <button type="button" onClick={() => setStatus(r.id, 'open')}
                className="text-xs text-gray-500 hover:text-gray-800">Reopen</button>
              <button type="button" onClick={() => remove(r.id)}
                className="text-xs text-gray-500 hover:text-red-600">Delete</button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        A daily check emails everyone in your company when a reminder enters its notify
        window. Overdue items are re-sent every few days until marked done.
      </p>
    </div>
  )
}
