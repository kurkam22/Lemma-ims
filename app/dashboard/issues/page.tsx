'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/attention'
import {
  AREAS,
  AREA_LABEL,
  CAPA_CLAUSE,
  EDITION,
  SEVERITY_LABEL,
  STATUS_LABEL,
  checkPhoto,
  issueCode,
  makeTitle,
  nextSteps,
  safeFileName,
  suggestClauses,
  type IssueArea,
  type IssueSeverity,
  type IssueStatus,
} from '@/lib/issues'

type Issue = {
  id: string
  company_id: string
  issue_no: number
  title: string
  description: string
  area: IssueArea
  severity: IssueSeverity
  status: IssueStatus
  reported_by: string | null
  owner_id: string | null
  due_date: string | null
  action_taken: string | null
  result_check: string | null
  closed_at: string | null
  capa_id: string | null
  photo_path: string | null
  created_at: string
}
type Person = { id: string; full_name: string | null; email: string | null }
type Link = { id: string; source_id: string; clause_id: string; origin: string; confirmed: boolean }
type Me = { id: string; role: string; company_id: string }
type Draft = {
  owner_id: string
  due_date: string
  severity: IssueSeverity
  action_taken: string
  result_check: string
}

const inputStyle = {
  border: '1px solid var(--lemma-line)',
  background: 'var(--lemma-surface)',
  color: 'var(--lemma-ink)',
} as const

const STATUS_TONE: Record<IssueStatus, { bg: string; fg: string }> = {
  new: { bg: 'var(--lemma-check-soft)', fg: 'var(--lemma-check)' },
  in_progress: { bg: 'var(--lemma-plan-soft)', fg: 'var(--lemma-plan)' },
  resolved: { bg: 'var(--lemma-act-soft)', fg: 'var(--lemma-act)' },
  closed: { bg: 'var(--lemma-ok-soft)', fg: 'var(--lemma-ok)' },
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      style={{ background: 'var(--lemma-primary)', color: '#fff' }}
    />
  )
}
function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      style={{ border: '1px solid var(--lemma-line)', color: 'var(--lemma-primary)', background: 'var(--lemma-surface)' }}
    />
  )
}

export default function IssuesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [me, setMe] = useState<Me | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [setupMissing, setSetupMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // report form
  const [showForm, setShowForm] = useState(false)
  const [what, setWhat] = useState('')
  const [area, setArea] = useState<IssueArea>('other')
  const [photo, setPhoto] = useState<File | null>(null)

  const nameOf = useCallback(
    (id: string | null) => {
      if (!id) return null
      const p = people.find((x) => x.id === id)
      return p?.full_name || p?.email?.split('@')[0] || 'Unknown'
    },
    [people]
  )

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: meRow } = await supabase
      .from('users')
      .select('id, role, company_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!meRow?.company_id) {
      setLoading(false)
      return
    }
    setMe(meRow as Me)
    const cid = meRow.company_id
    const [issuesRes, peopleRes] = await Promise.all([
      supabase.from('issues').select('*').eq('company_id', cid).order('created_at', { ascending: false }),
      supabase.from('users').select('id, full_name, email').eq('company_id', cid),
    ])
    if (issuesRes.error) {
      setSetupMissing(true)
      setLoading(false)
      return
    }
    setIssues((issuesRes.data ?? []) as Issue[])
    setPeople((peopleRes.data ?? []) as Person[])
    const linkRes = await supabase
      .from('requirement_links')
      .select('id, source_id, clause_id, origin, confirmed')
      .eq('company_id', cid)
      .eq('source_type', 'issue')
    setLinks((linkRes.data ?? []) as Link[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    if (new URLSearchParams(window.location.search).get('new') === '1') setShowForm(true)
  }, [load])

  const selected = issues.find((i) => i.id === selectedId) ?? null
  const canManage = !!me && !!selected && (['owner', 'admin'].includes(me.role) || selected.owner_id === me.id)

  // set the working copy when a problem is opened
  useEffect(() => {
    if (!selected) {
      setDraft(null)
      setPhotoUrl(null)
      return
    }
    setDraft({
      owner_id: selected.owner_id ?? '',
      due_date: selected.due_date ?? '',
      severity: selected.severity,
      action_taken: selected.action_taken ?? '',
      result_check: selected.result_check ?? '',
    })
    setPhotoUrl(null)
    if (selected.photo_path) {
      supabase.storage
        .from('issue-photos')
        .createSignedUrl(selected.photo_path, 3600)
        .then(({ data }) => setPhotoUrl(data?.signedUrl ?? null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function submitReport(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!me) return
    if (!what.trim()) {
      setError('Write what happened, in a sentence or two.')
      return
    }
    if (photo) {
      const bad = checkPhoto(photo)
      if (bad) {
        setError(bad)
        return
      }
    }
    setBusy(true)
    let photoPath: string | null = null
    let photoNote = ''
    if (photo) {
      const path = `${me.company_id}/${crypto.randomUUID()}-${safeFileName(photo.name)}`
      const up = await supabase.storage.from('issue-photos').upload(path, photo, { contentType: photo.type })
      if (up.error) photoNote = ' The photo could not be saved.'
      else photoPath = path
    }
    const { data: created, error: insErr } = await supabase
      .from('issues')
      .insert({
        company_id: me.company_id,
        title: makeTitle(what),
        description: what.trim(),
        area,
        reported_by: me.id,
        photo_path: photoPath,
      })
      .select('*')
      .single()
    if (insErr || !created) {
      setBusy(false)
      setError(insErr?.message ?? 'Could not send the report. Try again.')
      return
    }
    // Suggested requirement links (a fixed table; a person confirms them later).
    await supabase.from('requirement_links').insert(
      suggestClauses(area).map((s) => ({
        company_id: me.company_id,
        source_type: 'issue',
        source_id: created.id,
        standard: 'iso9001',
        edition: EDITION,
        clause_id: s.clause,
        origin: 'rule',
        confirmed: false,
      }))
    )
    setBusy(false)
    setWhat('')
    setArea('other')
    setPhoto(null)
    setShowForm(false)
    setNotice(`Sent. ${issueCode(created.issue_no)} is on the list.${photoNote}`)
    setFilter('open')
    await load()
  }

  async function saveIssue(patch: Partial<Issue>, okMessage?: string) {
    if (!selected) return
    setError(null)
    setNotice(null)
    setBusy(true)
    const { data, error: upErr } = await supabase
      .from('issues')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', selected.id)
      .select('*')
      .single()
    setBusy(false)
    if (upErr || !data) {
      const msg = upErr?.message ?? ''
      const permission =
        !msg || msg.includes('row-level security') || msg.includes('no rows') || msg.includes('multiple (or no) rows')
      setError(
        permission
          ? 'You do not have permission to change this problem. Ask a company owner or admin.'
          : msg
      )
      return
    }
    setIssues((prev) => prev.map((i) => (i.id === data.id ? (data as Issue) : i)))
    if (okMessage) setNotice(okMessage)
  }

  function draftPatch(): Partial<Issue> {
    if (!draft) return {}
    return {
      owner_id: draft.owner_id || null,
      due_date: draft.due_date || null,
      severity: draft.severity,
      action_taken: draft.action_taken.trim() || null,
      result_check: draft.result_check.trim() || null,
    }
  }

  async function moveTo(to: IssueStatus) {
    await saveIssue(
      { ...draftPatch(), status: to, closed_at: to === 'closed' ? new Date().toISOString() : null },
      to === 'closed' ? 'Closed.' : `Moved to “${STATUS_LABEL[to]}”.`
    )
  }

  async function raiseCapa() {
    if (!selected || !me || !draft) return
    setError(null)
    setBusy(true)
    const { data: capa, error: capaErr } = await supabase
      .from('capas')
      .insert({
        company_id: me.company_id,
        description: `${selected.title} (${issueCode(selected.issue_no)})`,
        severity: draft.severity,
        status: 'open',
        responsible_id: draft.owner_id || null,
        due_date: draft.due_date || null,
      })
      .select('id')
      .single()
    if (capaErr || !capa) {
      setBusy(false)
      setError(capaErr?.message ?? 'Could not create the corrective action.')
      return
    }
    await supabase.from('requirement_links').insert({
      company_id: me.company_id,
      source_type: 'issue',
      source_id: selected.id,
      standard: 'iso9001',
      edition: EDITION,
      clause_id: CAPA_CLAUSE.clause,
      origin: 'rule',
      confirmed: false,
    })
    setBusy(false)
    await saveIssue({ ...draftPatch(), capa_id: capa.id }, 'Corrective action created. Continue it on the Corrective actions page.')
    await load()
  }

  async function confirmLink(id: string) {
    if (!me) return
    const { error: e } = await supabase
      .from('requirement_links')
      .update({ confirmed: true, confirmed_by: me.id })
      .eq('id', id)
    if (e) setError('Could not confirm the link.')
    else setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, confirmed: true } : l)))
  }

  const visible = issues.filter((i) => (filter === 'all' ? true : filter === 'open' ? i.status !== 'closed' : i.status === 'closed'))
  const openCount = issues.filter((i) => i.status !== 'closed').length

  if (loading) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Loading…</div>

  if (setupMissing) {
    return (
      <div className="lemma-card p-5 max-w-2xl">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--lemma-ink)' }}>Problems are not set up yet</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--lemma-slate)' }}>
          Run the file <code>supabase/migration_issues.sql</code> once in Supabase (SQL Editor), then refresh this page.
        </p>
      </div>
    )
  }
  if (!me) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Finish company setup first.</div>

  const whyFor = (clause: string, area: IssueArea) =>
    [...suggestClauses(area), CAPA_CLAUSE].find((s) => s.clause === clause)?.why ?? ''

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>Problems</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            Anyone can report a problem. A manager assigns it, records the fix and checks the result.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => { setShowForm(true); setError(null) }}>
          Report a problem
        </PrimaryButton>
      </div>

      {notice && (
        <div role="status" className="px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-ok-soft)', color: 'var(--lemma-ok)' }}>
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-danger-soft)', color: 'var(--lemma-danger)' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={submitReport} className="lemma-card p-5 space-y-4">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>Report a problem</h2>
          <div>
            <label htmlFor="what" className="block text-sm font-medium mb-1" style={{ color: 'var(--lemma-ink)' }}>What happened?</label>
            <textarea
              id="what"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="For example: five parts arrived with damaged packaging."
              className="w-full rounded-md px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="area" className="block text-sm font-medium mb-1" style={{ color: 'var(--lemma-ink)' }}>Where did it happen?</label>
              <select id="area" value={area} onChange={(e) => setArea(e.target.value as IssueArea)} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="photo" className="block text-sm font-medium mb-1" style={{ color: 'var(--lemma-ink)' }}>Photo (optional)</label>
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send for review'}</PrimaryButton>
            <SecondaryButton type="button" onClick={() => { setShowForm(false); setError(null) }}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      <div className="flex gap-2" role="tablist" aria-label="Filter problems">
        {([['open', `Open (${openCount})`], ['closed', 'Closed'], ['all', 'All']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={filter === key ? { background: 'var(--lemma-primary)', color: '#fff' } : { border: '1px solid var(--lemma-line)', color: 'var(--lemma-slate)', background: 'var(--lemma-surface)' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="lemma-card overflow-x-auto">
        {visible.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: 'var(--lemma-slate)' }}>
            {issues.length === 0
              ? 'No problems reported yet. When something goes wrong, report it here so it is fixed and recorded.'
              : 'Nothing in this view.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--lemma-slate)' }}>
                {['ID', 'Problem', 'Where', 'Owner', 'Due', 'Status'].map((h) => (
                  <th key={h} className="text-left font-medium text-xs px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => {
                const tone = STATUS_TONE[i.status]
                return (
                  <tr
                    key={i.id}
                    onClick={() => { setSelectedId(i.id); setError(null); setNotice(null) }}
                    className="cursor-pointer"
                    style={{ borderTop: '1px solid var(--lemma-line)', background: i.id === selectedId ? 'var(--lemma-primary-soft)' : undefined }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--lemma-slate)' }}>{issueCode(i.issue_no)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(i.id)}
                        className="text-left font-medium"
                        style={{ color: 'var(--lemma-ink)' }}
                      >
                        {i.title}
                      </button>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--lemma-slate)' }}>{AREA_LABEL[i.area]}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--lemma-slate)' }}>{nameOf(i.owner_id) ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--lemma-slate)' }}>{i.due_date ? formatDate(i.due_date) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: tone.bg, color: tone.fg }}>
                        {STATUS_LABEL[i.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && draft && (
        <section className="lemma-card p-5 space-y-4" aria-label="Problem details">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs" style={{ color: 'var(--lemma-slate)' }}>{issueCode(selected.issue_no)} · {AREA_LABEL[selected.area]}</div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--lemma-ink)' }}>{selected.title}</h2>
              <div className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>
                Reported by {nameOf(selected.reported_by) ?? 'someone'} on {formatDate(selected.created_at)}
              </div>
            </div>
            <SecondaryButton type="button" onClick={() => setSelectedId(null)}>Close details</SecondaryButton>
          </div>

          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--lemma-ink)' }}>{selected.description}</p>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Photo attached to this problem" className="max-h-64 rounded-md" style={{ border: '1px solid var(--lemma-line)' }} />
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="owner" className="block text-sm font-medium mb-1">Owner</label>
              <select id="owner" disabled={!canManage} value={draft.owner_id} onChange={(e) => setDraft({ ...draft, owner_id: e.target.value })} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}>
                <option value="">Not chosen yet</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="due" className="block text-sm font-medium mb-1">Due date</label>
              <input id="due" type="date" disabled={!canManage} value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="sev" className="block text-sm font-medium mb-1">How serious?</label>
              <select id="sev" disabled={!canManage} value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as IssueSeverity })} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}>
                {(Object.keys(SEVERITY_LABEL) as IssueSeverity[]).map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium mb-1">What was done to fix it?</label>
            <textarea id="action" disabled={!canManage} value={draft.action_taken} onChange={(e) => setDraft({ ...draft, action_taken: e.target.value })} rows={2} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="check" className="block text-sm font-medium mb-1">How was the result checked?</label>
            <textarea id="check" disabled={!canManage} value={draft.result_check} onChange={(e) => setDraft({ ...draft, result_check: e.target.value })} rows={2} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2 items-center">
              <SecondaryButton type="button" disabled={busy} onClick={() => saveIssue(draftPatch(), 'Saved.')}>Save details</SecondaryButton>
              {nextSteps(selected).map((t) => (
                <span key={t.to} className="inline-flex items-center gap-2">
                  <PrimaryButton type="button" disabled={busy || !t.ok} onClick={() => moveTo(t.to)}>
                    {t.to === 'in_progress' ? (selected.status === 'new' ? 'Start work' : 'Reopen')
                      : t.to === 'resolved' ? 'Mark as fixed'
                      : 'Check result and close'}
                  </PrimaryButton>
                  {!t.ok && t.reason && <span className="text-xs" style={{ color: 'var(--lemma-slate)' }}>{t.reason}</span>}
                </span>
              ))}
              {!selected.capa_id && selected.status !== 'closed' && (
                <SecondaryButton type="button" disabled={busy} onClick={raiseCapa}>Raise a corrective action</SecondaryButton>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
              Only the owner of this problem, or a company owner or admin, can change it.
            </p>
          )}

          {selected.capa_id && (
            <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>
              A corrective action was created for this problem. <Link href="/dashboard/capa" className="font-medium" style={{ color: 'var(--lemma-primary)' }}>Open corrective actions</Link>
            </p>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--lemma-ink)' }}>May relate to ISO 9001:{EDITION}</h3>
            <p className="text-xs mb-2" style={{ color: 'var(--lemma-slate)' }}>
              Suggested from a fixed table, not by AI. A person confirms each one.
            </p>
            <ul className="flex flex-wrap gap-2">
              {links.filter((l) => l.source_id === selected.id).map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-full" style={{ background: l.confirmed ? 'var(--lemma-ok-soft)' : 'var(--lemma-canvas)', color: l.confirmed ? 'var(--lemma-ok)' : 'var(--lemma-slate)', border: '1px solid var(--lemma-line)' }} title={whyFor(l.clause_id, selected.area)}>
                  <span>Clause {l.clause_id}</span>
                  <span>{l.confirmed ? 'confirmed' : 'suggested'}</span>
                  {!l.confirmed && canManage && (
                    <button type="button" onClick={() => confirmLink(l.id)} className="font-medium underline" style={{ color: 'var(--lemma-primary)' }}>Confirm</button>
                  )}
                </li>
              ))}
              {links.filter((l) => l.source_id === selected.id).length === 0 && (
                <li className="text-xs" style={{ color: 'var(--lemma-slate)' }}>No suggestions yet.</li>
              )}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
