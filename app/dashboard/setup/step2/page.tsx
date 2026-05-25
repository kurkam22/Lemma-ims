'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepShell from '../_components/step-shell'

type Confidence = 'High' | 'Partial' | 'Missing'
type LocalStatus = 'pending' | 'confirmed' | 'edited' | 'answered'

type Finding = {
  clause: string
  summary: string
  source: string
  confidence: Confidence
  status: LocalStatus
  answer?: string
}

const SEED_FINDINGS: Finding[] = [
  {
    clause: '4.1',
    summary: 'Context of organisation found in strategy document',
    source: 'Strategy 2025.pdf',
    confidence: 'High',
    status: 'pending',
  },
  {
    clause: '4.2',
    summary: 'Interested parties not explicitly documented',
    source: '—',
    confidence: 'Missing',
    status: 'pending',
  },
  {
    clause: '5.1',
    summary: 'Leadership commitment mentioned in CEO letter',
    source: 'CEO letter.docx',
    confidence: 'Partial',
    status: 'pending',
  },
  {
    clause: '6.1',
    summary: 'Risk register found with 18 entries',
    source: 'Risk register.xlsx',
    confidence: 'High',
    status: 'pending',
  },
  {
    clause: '7.5',
    summary: 'Document control procedure exists but version control unclear',
    source: 'Doc procedure.pdf',
    confidence: 'Partial',
    status: 'pending',
  },
  {
    clause: '9.2',
    summary: 'No internal audit programme found',
    source: '—',
    confidence: 'Missing',
    status: 'pending',
  },
]

export default function Step2Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const [findings, setFindings] = useState<Finding[]>(SEED_FINDINGS)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRow } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!userRow?.company_id) {
        router.replace('/dashboard/setup/step1')
        return
      }
      const { data: c } = await supabase
        .from('companies')
        .select('setup_step')
        .eq('id', userRow.company_id)
        .maybeSingle()
      if (cancelled) return
      setCompanyId(userRow.company_id)
      setCurrentSetupStep(c?.setup_step ?? 0)

      const { data: existing } = await supabase
        .from('gap_answers')
        .select('clause_id, status, answer')
        .eq('company_id', userRow.company_id)
      if (existing && !cancelled) {
        setFindings((prev) =>
          prev.map((f) => {
            const match = existing.find((e) => e.clause_id === f.clause)
            if (match?.status === 'user_confirmed') {
              return { ...f, status: 'confirmed' as LocalStatus, answer: match.answer ?? f.summary }
            }
            return f
          })
        )
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const confirmedCount = findings.filter((f) => f.status !== 'pending').length
  const needsCheckCount = findings.filter(
    (f) => f.status === 'pending' && f.confidence === 'Partial'
  ).length
  const missingCount = findings.filter(
    (f) => f.status === 'pending' && f.confidence === 'Missing'
  ).length

  async function saveFinding(i: number, status: LocalStatus, answerOverride?: string) {
    if (!companyId) return
    const f = findings[i]
    const answer = answerOverride ?? f.summary
    const supabase = createClient()
    const { error: e } = await supabase.from('gap_answers').upsert(
      {
        company_id: companyId,
        clause_id: f.clause,
        answer,
        status: 'user_confirmed',
        evidence_confirmed: true,
      },
      { onConflict: 'company_id,clause_id' }
    )
    if (e) {
      setError(e.message)
      return
    }
    setFindings((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, status, answer } : row))
    )
  }

  function onEdit(i: number) {
    const f = findings[i]
    const next = window.prompt('Edit AI finding:', f.answer ?? f.summary)
    if (next === null) return
    saveFinding(i, 'edited', next)
  }

  function onAnswer(i: number) {
    const f = findings[i]
    const next = window.prompt(
      `Provide an answer for clause ${f.clause}:`,
      f.answer ?? ''
    )
    if (next === null || !next.trim()) return
    saveFinding(i, 'answered', next.trim())
  }

  async function save(advance: boolean) {
    if (!companyId) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const targetStep = Math.max(currentSetupStep, 2)
    const { error: e } = await supabase
      .from('companies')
      .update({ setup_step: advance ? targetStep : currentSetupStep })
      .eq('id', companyId)
    if (e) {
      setError(e.message)
      setSaving(false)
      return
    }
    if (advance) setCurrentSetupStep(targetStep)
    setSaving(false)
    if (advance) router.push('/dashboard/setup/step3')
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <StepShell
      step={2}
      title="Review AI findings"
      description="We scanned your uploaded documents and mapped what we found to ISO clauses. Confirm what's correct, edit what needs tweaking, and answer what's missing."
      saving={saving}
      onContinue={() => save(true)}
      onSaveDraft={() => save(false)}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Stat label="Confirmed" value={confirmedCount} accent="emerald" />
        <Stat label="Needs check" value={needsCheckCount} accent="amber" />
        <Stat label="Missing" value={missingCount} accent="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5">ISO Clause</th>
              <th className="px-4 py-2.5">What AI found</th>
              <th className="px-4 py-2.5">Source file</th>
              <th className="px-4 py-2.5">Confidence</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {findings.map((f, i) => (
              <tr key={f.clause}>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {f.clause}
                </td>
                <td className="px-4 py-3 text-gray-700">{f.answer ?? f.summary}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{f.source}</td>
                <td className="px-4 py-3">
                  <ConfidenceBadge value={f.confidence} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={f.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveFinding(i, 'confirmed')}
                      disabled={f.status === 'confirmed'}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(i)}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onAnswer(i)}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Answer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StepShell>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'emerald' | 'amber' | 'red'
}) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  }
  return (
    <div className={`flex-1 border rounded-lg px-4 py-2.5 ${colors[accent]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  )
}

function ConfidenceBadge({ value }: { value: Confidence }) {
  const styles = {
    High: 'bg-emerald-50 text-emerald-700',
    Partial: 'bg-amber-50 text-amber-700',
    Missing: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${styles[value]}`}>
      {value}
    </span>
  )
}

function StatusBadge({ status }: { status: LocalStatus }) {
  if (status === 'pending') return <span className="text-xs text-gray-400">—</span>
  const labels: Record<Exclude<LocalStatus, 'pending'>, string> = {
    confirmed: 'Confirmed',
    edited: 'Edited',
    answered: 'Answered',
  }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
      {labels[status as Exclude<LocalStatus, 'pending'>]}
    </span>
  )
}
