'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, dueLabel } from '@/lib/attention'
import { buildClock, type ClockEvent } from '@/lib/certclock'
import CertificateClock, { LegendMarker } from '@/app/dashboard/_components/certificate-clock'

type Certificate = { id: string; body: string | null; certificate_no: string | null; issued_on: string; expires_on: string }
type ExternalAudit = { id: string; kind: 'initial' | 'surveillance' | 'recertification'; planned_date: string; status: 'planned' | 'done' | 'cancelled' }
type Me = { company_id: string }

const KIND_LABEL = { initial: 'Initial certification audit', surveillance: 'Surveillance audit', recertification: 'Recertification audit' } as const

const inputStyle = { border: '1px solid var(--lemma-line)', background: 'var(--lemma-surface)', color: 'var(--lemma-ink)' } as const

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50" style={{ background: 'var(--lemma-primary)', color: '#fff' }} />
}
function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="text-sm font-medium px-3 py-1.5 rounded-md disabled:opacity-50" style={{ border: '1px solid var(--lemma-line)', color: 'var(--lemma-primary)', background: 'var(--lemma-surface)' }} />
}

/** Three years less a day, the usual length of an ISO certificate. */
function plusThreeYears(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]) + 3, Number(m[2]) - 1, Number(m[3]) - 1))
  return d.toISOString().slice(0, 10)
}

export default function CertificationPage() {
  const supabase = useMemo(() => createClient(), [])
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupMissing, setSetupMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [cert, setCert] = useState<Certificate | null>(null)
  const [externals, setExternals] = useState<ExternalAudit[]>([])
  const [internals, setInternals] = useState<{ id: string; title: string | null; department: string; scheduled_date: string | null; status: string }[]>([])
  const [reviews, setReviews] = useState<{ id: string; review_date: string | null; status: string }[]>([])
  const [openCapas, setOpenCapas] = useState(0)
  const [docsWaiting, setDocsWaiting] = useState(0)
  const [openIssues, setOpenIssues] = useState(0)

  // certificate form
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [no, setNo] = useState('')
  const [issued, setIssued] = useState('')
  const [expires, setExpires] = useState('')

  // new external audit form
  const [newKind, setNewKind] = useState<ExternalAudit['kind']>('surveillance')
  const [newDate, setNewDate] = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoading(false)
    const { data: meRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
    if (!meRow?.company_id) return setLoading(false)
    setMe(meRow as Me)
    const cid = meRow.company_id
    const [certRes, extRes, intRes, revRes, capaRes, docRes, issRes] = await Promise.all([
      supabase.from('certificates').select('id, body, certificate_no, issued_on, expires_on').eq('company_id', cid).eq('standard', 'iso9001').maybeSingle(),
      supabase.from('external_audits').select('id, kind, planned_date, status').eq('company_id', cid).order('planned_date', { ascending: true }),
      supabase.from('audits').select('id, title, department, scheduled_date, status').eq('company_id', cid),
      supabase.from('management_reviews').select('id, review_date, status').eq('company_id', cid),
      supabase.from('capas').select('id', { count: 'exact', head: true }).eq('company_id', cid).in('status', ['open', 'in_progress']),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'in_review'),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('company_id', cid).neq('status', 'closed'),
    ])
    if (certRes.error || extRes.error) {
      setSetupMissing(true)
      return setLoading(false)
    }
    setCert((certRes.data as Certificate | null) ?? null)
    setExternals((extRes.data ?? []) as ExternalAudit[])
    setInternals(intRes.data ?? [])
    setReviews(revRes.data ?? [])
    setOpenCapas(capaRes.count ?? 0)
    setDocsWaiting(docRes.count ?? 0)
    setOpenIssues(issRes.error ? 0 : issRes.count ?? 0)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const today = useMemo(() => new Date(), [])
  const model = useMemo(
    () => (cert ? buildClock({ today, issuedOn: cert.issued_on, expiresOn: cert.expires_on, external: externals, internal: internals, reviews }) : null),
    [cert, externals, internals, reviews, today]
  )

  function startEdit() {
    setBody(cert?.body ?? '')
    setNo(cert?.certificate_no ?? '')
    setIssued(cert?.issued_on ?? '')
    setExpires(cert?.expires_on ?? '')
    setEditing(true)
    setError(null)
  }

  async function saveCert(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!me) return
    if (!issued || !expires) return setError('Enter both dates from your certificate.')
    if (expires <= issued) return setError('The expiry date must be after the issue date.')
    setBusy(true)
    const { error: err } = await supabase.from('certificates').upsert(
      { company_id: me.company_id, standard: 'iso9001', body: body.trim() || null, certificate_no: no.trim() || null, issued_on: issued, expires_on: expires, updated_at: new Date().toISOString() },
      { onConflict: 'company_id,standard' }
    )
    setBusy(false)
    if (err) return setError(err.message)
    setEditing(false)
    setNotice('Certificate saved.')
    await load()
  }

  async function addExternal(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!me || !newDate) return setError('Choose the date of the audit.')
    setBusy(true)
    const { error: err } = await supabase.from('external_audits').insert({ company_id: me.company_id, kind: newKind, planned_date: newDate })
    setBusy(false)
    if (err) return setError(err.message)
    setNewDate('')
    setNotice('Audit added.')
    await load()
  }

  async function setExternalStatus(id: string, status: ExternalAudit['status']) {
    const { error: err } = await supabase.from('external_audits').update({ status }).eq('id', id)
    if (err) return setError(err.message)
    await load()
  }
  async function removeExternal(id: string) {
    const { error: err } = await supabase.from('external_audits').delete().eq('id', id)
    if (err) return setError(err.message)
    await load()
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Loading…</div>

  if (setupMissing) {
    return (
      <div className="lemma-card p-5 max-w-2xl">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--lemma-ink)' }}>The certificate clock is not set up yet</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--lemma-slate)' }}>
          Run the file <code>supabase/migration_certification.sql</code> once in Supabase (SQL Editor), then refresh this page.
        </p>
      </div>
    )
  }
  if (!me) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Finish company setup first.</div>

  const showForm = !cert || editing
  const upcoming: ClockEvent[] = model ? model.events.filter((e) => !e.done && e.daysLeft >= 0).slice(0, 5) : []
  const lastInternal = model ? [...model.events].reverse().find((e) => e.kind === 'internal' && e.done) : undefined

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>Certificate clock</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--lemma-slate)' }}>
          Three rings, one for each year of your ISO 9001 certificate. The same angle means the same time of year, so you can see the audit season coming back.
        </p>
      </div>

      {notice && <div role="status" className="px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-ok-soft)', color: 'var(--lemma-ok)' }}>{notice}</div>}
      {error && <div role="alert" className="px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-danger-soft)', color: 'var(--lemma-danger)' }}>{error}</div>}

      {showForm && (
        <form onSubmit={saveCert} className="lemma-card p-5 space-y-4 max-w-2xl">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{cert ? 'Edit your certificate' : 'Enter your certificate'}</h2>
          <p className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
            Copy the two dates from your certificate. Not certified yet? Come back after your certification audit. Until then your audits and reviews are on the Internal audits and Management review pages.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issued" className="block text-sm font-medium mb-1">Issued on</label>
              <input id="issued" type="date" value={issued} onChange={(e) => { setIssued(e.target.value); if (!expires) setExpires(plusThreeYears(e.target.value)) }} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="expires" className="block text-sm font-medium mb-1">Valid until</label>
              <input id="expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="body" className="block text-sm font-medium mb-1">Certification body (optional)</label>
              <input id="body" value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="no" className="block text-sm font-medium mb-1">Certificate number (optional)</label>
              <input id="no" value={no} onChange={(e) => setNo(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save certificate'}</PrimaryButton>
            {cert && <SecondaryButton type="button" onClick={() => setEditing(false)}>Cancel</SecondaryButton>}
          </div>
        </form>
      )}

      {cert && model && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="lemma-card p-4">
            <CertificateClock model={model} today={today} />
          </div>

          <div className="space-y-5">
            <section className="lemma-card overflow-hidden" aria-label="Coming up">
              <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>Coming up</h2>
                <span className="text-xs" style={{ color: 'var(--lemma-slate)' }}>Certificate ends {formatDate(cert.expires_on)} ({model.daysToExpiry} days)</span>
              </div>
              {upcoming.length === 0 ? (
                <p className="px-5 pb-5 text-sm" style={{ color: 'var(--lemma-slate)' }}>Nothing planned yet. Add your next audit below.</p>
              ) : (
                <ul>
                  {upcoming.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-2.5" style={{ borderTop: '1px solid var(--lemma-line)', background: i === 0 ? 'var(--lemma-check-soft)' : undefined }}>
                      <LegendMarker kind={e.kind} done={false} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate" style={{ color: 'var(--lemma-ink)' }}>{e.label}</span>
                        <span className="block text-xs truncate" style={{ color: 'var(--lemma-slate)' }}>{formatDate(e.date)} · {e.sub}</span>
                      </span>
                      <span className="text-xs font-medium whitespace-nowrap" style={{ color: i === 0 ? 'var(--lemma-check)' : 'var(--lemma-slate)' }}>{dueLabel(e.daysLeft, e.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="lemma-card p-5 space-y-2.5" aria-label="Before the next audit">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{model.next ? `Before ${model.next.label.toLowerCase()}` : 'To keep ready'}</h2>
              {[
                ['Corrective actions still open', openCapas],
                ['Problems still open', openIssues],
                ['Documents waiting for approval', docsWaiting],
              ].map(([label, n]) => (
                <div key={label as string} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--lemma-slate)' }}>{label}</span>
                  <span className="font-semibold" style={{ color: (n as number) > 0 ? 'var(--lemma-check)' : 'var(--lemma-ok)' }}>{n as number}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--lemma-slate)' }}>Last internal audit</span>
                <span className="font-semibold" style={{ color: lastInternal ? 'var(--lemma-ok)' : 'var(--lemma-check)' }}>{lastInternal ? formatDate(lastInternal.date) : 'None done yet'}</span>
              </div>
              <Link href="/dashboard/gap-assessment" className="inline-block text-sm font-medium px-4 py-2 rounded-md" style={{ background: 'var(--lemma-primary)', color: '#fff' }}>Check your requirements</Link>
            </section>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs items-center px-1" style={{ color: 'var(--lemma-slate)' }}>
              <span className="flex items-center gap-1.5"><LegendMarker kind="external" /> External audit</span>
              <span className="flex items-center gap-1.5"><LegendMarker kind="internal" /> Internal audit</span>
              <span className="flex items-center gap-1.5"><LegendMarker kind="review" /> Management review</span>
              <span>Filled = done · outline = coming</span>
            </div>
          </div>
        </div>
      )}

      {cert && !editing && (
        <section className="lemma-card p-5 max-w-3xl space-y-4" aria-label="Audits by your certification body">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>Audits by your certification body</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--lemma-slate)' }}>
                Certificate {cert.certificate_no ? `${cert.certificate_no} · ` : ''}{cert.body ? `${cert.body} · ` : ''}valid {formatDate(cert.issued_on)} to {formatDate(cert.expires_on)}
              </p>
            </div>
            <SecondaryButton type="button" onClick={startEdit}>Edit certificate</SecondaryButton>
          </div>

          {externals.length > 0 && (
            <ul>
              {externals.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm" style={{ borderTop: '1px solid var(--lemma-line)' }}>
                  <span className="flex-1 min-w-[10rem]" style={{ color: 'var(--lemma-ink)' }}>{KIND_LABEL[a.kind]}</span>
                  <span style={{ color: 'var(--lemma-slate)' }}>{formatDate(a.planned_date)}</span>
                  <span className="text-xs font-medium" style={{ color: a.status === 'done' ? 'var(--lemma-ok)' : a.status === 'cancelled' ? 'var(--lemma-mist)' : 'var(--lemma-check)' }}>
                    {a.status === 'done' ? 'Done' : a.status === 'cancelled' ? 'Cancelled' : 'Planned'}
                  </span>
                  <span className="flex gap-2">
                    {a.status === 'planned' && <SecondaryButton type="button" onClick={() => setExternalStatus(a.id, 'done')}>Mark done</SecondaryButton>}
                    {a.status !== 'planned' && <SecondaryButton type="button" onClick={() => setExternalStatus(a.id, 'planned')}>Reopen</SecondaryButton>}
                    <SecondaryButton type="button" onClick={() => removeExternal(a.id)}>Remove</SecondaryButton>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addExternal} className="flex flex-wrap items-end gap-3 pt-2" style={{ borderTop: '1px solid var(--lemma-line)' }}>
            <div>
              <label htmlFor="kind" className="block text-xs font-medium mb-1">Type</label>
              <select id="kind" value={newKind} onChange={(e) => setNewKind(e.target.value as ExternalAudit['kind'])} className="rounded-md px-3 py-2 text-sm" style={inputStyle}>
                {(Object.keys(KIND_LABEL) as ExternalAudit['kind'][]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ndate" className="block text-xs font-medium mb-1">Date</label>
              <input id="ndate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <PrimaryButton type="submit" disabled={busy}>Add audit</PrimaryButton>
          </form>
          <p className="text-[11px]" style={{ color: 'var(--lemma-mist)' }}>
            Dates come from you and your certification body. Lemma does not schedule audits for them and does not guarantee certification.
          </p>
        </section>
      )}
    </div>
  )
}
