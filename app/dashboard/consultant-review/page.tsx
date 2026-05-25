'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string
  document_id: string | null
  consultant_name: string
  consultant_email: string | null
  message: string | null
  status: 'pending' | 'reviewed' | 'approved' | 'returned'
  comments: { author: string; body: string; at: string }[]
  requested_at: string
  reviewed_at: string | null
}

type Doc = { id: string; title: string; document_code: string | null; status: string }

const STATUSES: Review['status'][] = ['pending', 'reviewed', 'approved', 'returned']

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function ConsultantReviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [showForm, setShowForm] = useState(false)
  const [opened, setOpened] = useState<Review | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const cid = userRow.company_id
      const [reviewsRes, docsRes] = await Promise.all([
        supabase.from('consultant_reviews').select('*').eq('company_id', cid).order('requested_at', { ascending: false }),
        supabase.from('documents').select('id, title, document_code, status').eq('company_id', cid).order('updated_at', { ascending: false }),
      ])
      if (cancelled) return
      setCompanyId(cid)
      setReviews((reviewsRes.data ?? []).map(normalise))
      setDocs((docsRes.data ?? []) as Doc[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function createReview(payload: { document_id: string | null; consultant_name: string; consultant_email: string; message: string }) {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('consultant_reviews')
      .insert({
        company_id: companyId,
        document_id: payload.document_id,
        consultant_name: payload.consultant_name,
        consultant_email: payload.consultant_email || null,
        message: payload.message || null,
        status: 'pending',
      })
      .select('*')
      .single()
    if (e) { setError(e.message); return }
    if (data) {
      setReviews(prev => [normalise(data), ...prev])
      setShowForm(false)
    }
  }

  async function updateStatus(id: string, status: Review['status']) {
    const supabase = createClient()
    const patch: Record<string, unknown> = { status }
    if (status !== 'pending') patch.reviewed_at = new Date().toISOString()
    const { error: e } = await supabase.from('consultant_reviews').update(patch).eq('id', id)
    if (e) { setError(e.message); return }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status, reviewed_at: status !== 'pending' ? new Date().toISOString() : r.reviewed_at } : r))
  }

  async function addComment(id: string, body: string) {
    if (!body.trim()) return
    const supabase = createClient()
    const review = reviews.find(r => r.id === id)
    if (!review) return
    const newComments = [...review.comments, { author: 'You', body: body.trim(), at: new Date().toISOString() }]
    const { error: e } = await supabase.from('consultant_reviews').update({ comments: newComments }).eq('id', id)
    if (e) { setError(e.message); return }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, comments: newComments } : r))
    if (opened?.id === id) setOpened({ ...review, comments: newComments })
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Consultant review</h1>
          <p className="text-sm text-gray-500 mt-1">Send documents to an external ISO consultant for review and feedback.</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap">+ Request review</button>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {reviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">No consultant reviews requested yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Document</th>
                <th className="px-4 py-2.5">Consultant</th>
                <th className="px-4 py-2.5">Requested</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Comments</th>
                <th className="px-4 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map(r => {
                const doc = docs.find(d => d.id === r.document_id)
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-900">{doc?.title ?? '(unlinked)'}</td>
                    <td className="px-4 py-3 text-gray-700">{r.consultant_name}{r.consultant_email && <span className="text-gray-400 ml-1">· {r.consultant_email}</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.requested_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value as Review['status'])} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white capitalize">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.comments.length}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setOpened(r)} className="text-xs font-medium text-blue-600 hover:text-blue-800">View →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && companyId && <RequestForm docs={docs} onClose={() => setShowForm(false)} onSubmit={createReview} />}
      {opened && <CommentsPanel review={opened} doc={docs.find(d => d.id === opened.document_id) ?? null} onClose={() => setOpened(null)} onAddComment={body => addComment(opened.id, body)} />}
    </div>
  )
}

function normalise(row: any): Review {
  return {
    id: row.id,
    document_id: row.document_id ?? null,
    consultant_name: row.consultant_name,
    consultant_email: row.consultant_email ?? null,
    message: row.message ?? null,
    status: row.status,
    comments: Array.isArray(row.comments) ? row.comments : [],
    requested_at: row.requested_at,
    reviewed_at: row.reviewed_at ?? null,
  }
}

function RequestForm({ docs, onClose, onSubmit }: { docs: Doc[]; onClose: () => void; onSubmit: (p: { document_id: string | null; consultant_name: string; consultant_email: string; message: string }) => void | Promise<void> }) {
  const [docId, setDocId] = useState<string>(docs[0]?.id ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await onSubmit({
      document_id: docId || null,
      consultant_name: name.trim(),
      consultant_email: email.trim(),
      message: message.trim(),
    })
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request consultant review</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document</label>
            {docs.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No documents yet — you can still request a general review.</p>
            ) : (
              <select value={docId} onChange={e => setDocId(e.target.value)} className={inputCls}>
                <option value="">No specific document</option>
                {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consultant name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consultant email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className={inputCls} placeholder="What would you like the consultant to check?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-gray-700 px-4 py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">{submitting ? 'Sending…' : 'Send request'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CommentsPanel({ review, doc, onClose, onAddComment }: { review: Review; doc: Doc | null; onClose: () => void; onAddComment: (body: string) => void | Promise<void> }) {
  const [draft, setDraft] = useState('')

  return (
    <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{doc?.title ?? 'Review'}</h2>
        <p className="text-xs text-gray-500 mb-4">With {review.consultant_name}</p>

        {review.message && (
          <div className="mb-4 px-4 py-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <div className="text-[10px] uppercase font-semibold mb-1">Initial message</div>
            {review.message}
          </div>
        )}

        <div className="space-y-3 mb-4">
          {review.comments.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No comments yet.</p>
          ) : (
            review.comments.map((c, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-3">
                <div className="text-xs text-gray-500">{c.author} · {new Date(c.at).toLocaleString()}</div>
                <div className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">{c.body}</div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3} className={`${inputCls}`} placeholder="Add a comment…" />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-gray-700 px-4 py-2">Close</button>
            <button type="button" onClick={() => { onAddComment(draft); setDraft('') }} disabled={!draft.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">Add comment</button>
          </div>
        </div>
      </div>
    </div>
  )
}
