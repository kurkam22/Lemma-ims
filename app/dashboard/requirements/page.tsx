'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildBoardRows } from '@/lib/requirement-rows'
import { useT } from '@/lib/i18n/provider'
import RequirementBoard, { type BoardRow } from '@/app/dashboard/_components/requirement-board'

export default function RequirementsPage() {
  const { t, locale } = useT()
  const [rows, setRows] = useState<BoardRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      const { data: me } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!me?.company_id) return setLoading(false)
      const cid = me.company_id
      const [gapsRes, docsRes, evRes] = await Promise.all([
        supabase.from('gap_answers').select('clause_id, status').eq('company_id', cid),
        supabase.from('documents').select('document_code, status').eq('company_id', cid),
        supabase.from('evidence').select('clause_ids').eq('company_id', cid),
      ])
      if (cancelled) return
      const gapMap = new Map<string, string>()
      ;(gapsRes.data ?? []).forEach((g) => g.clause_id && gapMap.set(g.clause_id, g.status))
      const docMap = new Map<string, string>()
      ;(docsRes.data ?? []).forEach((d) => d.document_code && docMap.set(d.document_code, d.status))
      const evCount = new Map<string, number>()
      ;(evRes.data ?? []).forEach((e) => {
        ;((e.clause_ids ?? []) as string[]).forEach((id) => evCount.set(id, (evCount.get(id) ?? 0) + 1))
      })
      setRows(buildBoardRows({ gaps: gapMap, docs: docMap, evidence: evCount, locale }))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [locale])

  if (loading) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Loading…</div>
  if (!rows) return <div className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Finish company setup first.</div>

  const allNotStarted = rows.every((r) => r.state === 'notstarted')

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>Requirements</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--lemma-slate)' }}>
          {t('req.pageIntro')}
        </p>
      </div>
      {allNotStarted && (
        <div className="px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-check-soft)', color: 'var(--lemma-check)' }}>
          {t('req.empty')}{' '}
          <Link href="/dashboard/gap-assessment" className="font-medium underline">{t('req.emptyLink')}</Link>
        </div>
      )}
      <RequirementBoard rows={rows} />
    </div>
  )
}
