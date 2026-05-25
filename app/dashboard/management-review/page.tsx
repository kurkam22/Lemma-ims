'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string
  review_date: string | null
  manual_inputs: { resource_adequacy?: string; improvement_opportunities?: string }
  agenda: string | null
  decisions: string | null
  action_items: { text: string; owner?: string; deadline?: string }[]
  resource_needs: string | null
  minutes: string | null
  status: 'draft' | 'completed'
  created_at: string
}

type AutoData = {
  objectives: { description: string; target_value?: string; deadline?: string }[]
  audit_summary: { total: number; completed: number; nc: number }
  capa_status: { open: number; in_progress: number; closed: number }
  supplier_avg_score: number | null
  supplier_count: number
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function ManagementReviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [autoData, setAutoData] = useState<AutoData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [current, setCurrent] = useState<Review | null>(null)
  const [resourceAdequacy, setResourceAdequacy] = useState('')
  const [improvementOpps, setImprovementOpps] = useState('')
  const [agenda, setAgenda] = useState('')
  const [decisions, setDecisions] = useState('')
  const [resourceNeeds, setResourceNeeds] = useState('')
  const [actions, setActions] = useState<{ text: string; owner?: string; deadline?: string }[]>([])
  const [generatingAgenda, setGeneratingAgenda] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const cid = userRow.company_id
      const [companyRes, auditsRes, findingsRes, capasRes, suppliersRes, reviewsRes] = await Promise.all([
        supabase.from('companies').select('quality_objectives').eq('id', cid).maybeSingle(),
        supabase.from('audits').select('id, status').eq('company_id', cid),
        supabase.from('audit_findings').select('finding_type').eq('company_id', cid),
        supabase.from('capas').select('status').eq('company_id', cid),
        supabase.from('suppliers').select('evaluation_score').eq('company_id', cid),
        supabase.from('management_reviews').select('*').eq('company_id', cid).order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      const objectives = Array.isArray(companyRes.data?.quality_objectives) ? (companyRes.data!.quality_objectives as AutoData['objectives']) : []
      const audits = auditsRes.data ?? []
      const findings = findingsRes.data ?? []
      const capas = capasRes.data ?? []
      const suppliers = suppliersRes.data ?? []
      const scored = suppliers.filter(s => s.evaluation_score != null)
      const avgScore = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.evaluation_score as number), 0) / scored.length : null
      setCompanyId(cid)
      setAutoData({
        objectives,
        audit_summary: {
          total: audits.length,
          completed: audits.filter(a => a.status === 'completed').length,
          nc: findings.filter(f => f.finding_type === 'nc').length,
        },
        capa_status: {
          open: capas.filter(c => c.status === 'open').length,
          in_progress: capas.filter(c => c.status === 'in_progress').length,
          closed: capas.filter(c => c.status === 'closed').length,
        },
        supplier_avg_score: avgScore,
        supplier_count: suppliers.length,
      })
      setReviews((reviewsRes.data ?? []) as Review[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function startNewReview() {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('management_reviews')
      .insert({
        company_id: companyId,
        review_date: new Date().toISOString().slice(0, 10),
        manual_inputs: {},
        action_items: [],
        status: 'draft',
      })
      .select('*')
      .single()
    if (e) { setError(e.message); return }
    if (data) {
      const r = data as Review
      setReviews(prev => [r, ...prev])
      openReview(r)
    }
  }

  function openReview(r: Review) {
    setCurrent(r)
    setResourceAdequacy(r.manual_inputs?.resource_adequacy ?? '')
    setImprovementOpps(r.manual_inputs?.improvement_opportunities ?? '')
    setAgenda(r.agenda ?? '')
    setDecisions(r.decisions ?? '')
    setResourceNeeds(r.resource_needs ?? '')
    setActions(Array.isArray(r.action_items) ? r.action_items : [])
  }

  async function generateAgenda() {
    if (!autoData) return
    setGeneratingAgenda(true)
    try {
      const res = await fetch('/api/management-review/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...autoData,
            resource_adequacy: resourceAdequacy,
            improvement_opportunities: improvementOpps,
          },
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setAgenda(json.agenda ?? '')
      }
    } catch {
      setError('Could not generate agenda.')
    }
    setGeneratingAgenda(false)
  }

  async function saveReview(close: boolean) {
    if (!current) return
    setSaving(true)
    const supabase = createClient()
    const patch: Partial<Review> = {
      manual_inputs: {
        resource_adequacy: resourceAdequacy,
        improvement_opportunities: improvementOpps,
      },
      agenda,
      decisions,
      action_items: actions.filter(a => a.text.trim()),
      resource_needs: resourceNeeds,
      status: close ? 'completed' : 'draft',
    }
    const { data, error: e } = await supabase
      .from('management_reviews')
      .update(patch)
      .eq('id', current.id)
      .select('*')
      .single()
    if (e) { setError(e.message); setSaving(false); return }
    if (data) {
      const r = data as Review
      setReviews(prev => prev.map(x => x.id === r.id ? r : x))
      setCurrent(r)
    }
    setSaving(false)
  }

  function generateMinutes() {
    if (!current || !autoData) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Management Review Minutes</title>
<style>body{font-family:Calibri,Arial,sans-serif;max-width:720px;margin:40px auto;}h1{font-size:20pt;}h2{font-size:14pt;margin-top:24pt;}pre{white-space:pre-wrap;font-family:inherit;}table{width:100%;border-collapse:collapse;}td,th{border:1pt solid #444;padding:6pt;text-align:left;}</style></head><body>
<h1>Management Review Minutes</h1>
<p><strong>Date:</strong> ${current.review_date ?? '—'}</p>

<h2>Inputs (auto-collected)</h2>
<table>
<tr><th>Quality objectives</th><td>${autoData.objectives.length} defined</td></tr>
<tr><th>Audits</th><td>${autoData.audit_summary.completed} completed / ${autoData.audit_summary.total} total — ${autoData.audit_summary.nc} NCs raised</td></tr>
<tr><th>CAPA status</th><td>${autoData.capa_status.open} open · ${autoData.capa_status.in_progress} in progress · ${autoData.capa_status.closed} closed</td></tr>
<tr><th>Supplier performance</th><td>Avg score ${autoData.supplier_avg_score?.toFixed(1) ?? '—'} across ${autoData.supplier_count} suppliers</td></tr>
</table>

<h2>Inputs (manual)</h2>
<p><strong>Resource adequacy:</strong></p><pre>${escapeHtml(resourceAdequacy || '—')}</pre>
<p><strong>Improvement opportunities:</strong></p><pre>${escapeHtml(improvementOpps || '—')}</pre>

<h2>Agenda</h2>
<pre>${escapeHtml(agenda || '—')}</pre>

<h2>Decisions</h2>
<pre>${escapeHtml(decisions || '—')}</pre>

<h2>Action items</h2>
<table><tr><th>Action</th><th>Owner</th><th>Deadline</th></tr>
${actions.map(a => `<tr><td>${escapeHtml(a.text)}</td><td>${escapeHtml(a.owner ?? '')}</td><td>${escapeHtml(a.deadline ?? '')}</td></tr>`).join('')}
</table>

<h2>Resource needs</h2>
<pre>${escapeHtml(resourceNeeds || '—')}</pre>
</body></html>`
    downloadBlob(new Blob([html], { type: 'application/msword' }), `management-review-${current.review_date ?? 'minutes'}.doc`)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Management review</h1>
          <p className="text-sm text-gray-500 mt-1">ISO 9001 clause 9.3 — review the QMS with leadership.</p>
        </div>
        <button type="button" onClick={startNewReview} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">+ Start new review</button>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {autoData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Quality objectives" value={`${autoData.objectives.length}`} sublabel="defined" />
          <Card label="Audits" value={`${autoData.audit_summary.completed} / ${autoData.audit_summary.total}`} sublabel={`${autoData.audit_summary.nc} NCs`} />
          <Card label="CAPAs" value={`${autoData.capa_status.open + autoData.capa_status.in_progress} open`} sublabel={`${autoData.capa_status.closed} closed`} />
          <Card label="Supplier avg score" value={autoData.supplier_avg_score?.toFixed(1) ?? '—'} sublabel={`${autoData.supplier_count} suppliers`} />
        </div>
      )}

      {current && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Review · {current.review_date}</h2>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${current.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{current.status}</span>
          </div>

          <Section title="Manual inputs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Resource adequacy</label>
                <textarea value={resourceAdequacy} onChange={e => setResourceAdequacy(e.target.value)} rows={3} className={inputCls} placeholder="People, infrastructure, environment, monitoring resources — adequate?" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Improvement opportunities</label>
                <textarea value={improvementOpps} onChange={e => setImprovementOpps(e.target.value)} rows={3} className={inputCls} placeholder="What could we improve next quarter?" />
              </div>
            </div>
          </Section>

          <Section title="Agenda" action={<button type="button" onClick={generateAgenda} disabled={generatingAgenda} className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">{generatingAgenda ? 'Generating…' : '✨ Generate with AI'}</button>}>
            <textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={10} className={`${inputCls} font-mono text-xs`} placeholder="Click 'Generate with AI' to draft from collected data." />
          </Section>

          <Section title="Decisions">
            <textarea value={decisions} onChange={e => setDecisions(e.target.value)} rows={4} className={inputCls} placeholder="Key decisions made during the review." />
          </Section>

          <Section title="Action items" action={<button type="button" onClick={() => setActions([...actions, { text: '' }])} className="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add</button>}>
            {actions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No actions yet.</p>
            ) : (
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input value={a.text} placeholder="Action" onChange={e => setActions(actions.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))} className={`${inputCls} col-span-6`} />
                    <input value={a.owner ?? ''} placeholder="Owner" onChange={e => setActions(actions.map((x, idx) => idx === i ? { ...x, owner: e.target.value } : x))} className={`${inputCls} col-span-3`} />
                    <input type="date" value={a.deadline ?? ''} onChange={e => setActions(actions.map((x, idx) => idx === i ? { ...x, deadline: e.target.value } : x))} className={`${inputCls} col-span-2`} />
                    <button type="button" onClick={() => setActions(actions.filter((_, idx) => idx !== i))} className="col-span-1 text-gray-400 hover:text-red-600 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Resource needs">
            <textarea value={resourceNeeds} onChange={e => setResourceNeeds(e.target.value)} rows={3} className={inputCls} placeholder="People, equipment, budget required to deliver the actions above." />
          </Section>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setCurrent(null)} className="text-sm text-gray-600 hover:text-gray-900">← Close</button>
            <div className="flex gap-2">
              <button type="button" onClick={generateMinutes} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Generate minutes</button>
              <button type="button" onClick={() => saveReview(false)} disabled={saving} className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 disabled:opacity-50">Save draft</button>
              <button type="button" onClick={() => saveReview(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">{saving ? 'Saving…' : 'Mark complete'}</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Past reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">No reviews yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions logged</th>
                  <th className="px-4 py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-900">{r.review_date ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{Array.isArray(r.action_items) ? r.action_items.length : 0}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openReview(r)} className="text-xs font-medium text-blue-600 hover:text-blue-800">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
