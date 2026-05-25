'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StepShell from '../_components/step-shell'

const REQUIRED_TEMPLATES = 18

type Metrics = {
  documentsReady: number
  evidenceMissing: number
  profilePct: number
  daysToTarget: number | null
  targetDate: string | null
}

export default function Step5Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

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
      const cid = userRow.company_id

      const [companyRes, docsRes, evRes] = await Promise.all([
        supabase
          .from('companies')
          .select('setup_step, target_date')
          .eq('id', cid)
          .maybeSingle(),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', cid)
          .eq('status', 'approved'),
        supabase
          .from('gap_answers')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', cid)
          .eq('evidence_confirmed', false),
      ])

      if (cancelled) return

      const setupStep = companyRes.data?.setup_step ?? 0
      const target = companyRes.data?.target_date ?? null
      let days: number | null = null
      if (target) {
        const t = new Date(target).getTime()
        const now = Date.now()
        days = Math.ceil((t - now) / (1000 * 60 * 60 * 24))
      }

      setCompanyId(cid)
      setCurrentSetupStep(setupStep)
      setMetrics({
        documentsReady: Math.max(0, REQUIRED_TEMPLATES - (docsRes.count ?? 0)),
        evidenceMissing: evRes.count ?? 0,
        profilePct: Math.round((Math.max(setupStep, 4) / 5) * 100),
        daysToTarget: days,
        targetDate: target,
      })
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function finish() {
    if (!companyId) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const targetStep = Math.max(currentSetupStep, 5)
    const { error: e } = await supabase
      .from('companies')
      .update({ setup_step: targetStep })
      .eq('id', companyId)
    if (e) {
      setError(e.message)
      setSaving(false)
      return
    }
    router.push('/dashboard')
  }

  if (loading || !metrics) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  return (
    <StepShell
      step={5}
      title="Next steps"
      description="Setup is complete. Here's where you stand and what to tackle next."
      saving={saving}
      continueLabel="Finish setup"
      onContinue={finish}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Documents ready to generate"
          value={metrics.documentsReady.toString()}
          sublabel={`of ${REQUIRED_TEMPLATES} required`}
          accent="indigo"
        />
        <MetricCard
          label="Evidence missing"
          value={metrics.evidenceMissing.toString()}
          sublabel="gaps without evidence"
          accent="red"
        />
        <MetricCard
          label="Profile complete"
          value={`${metrics.profilePct}%`}
          accent="emerald"
        />
        <MetricCard
          label="Days to target date"
          value={metrics.daysToTarget !== null ? metrics.daysToTarget.toString() : '—'}
          sublabel={metrics.targetDate ?? 'no target set'}
          accent="amber"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommended actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionLink
            href="/dashboard/documents/generator"
            title="Generate ready documents"
            description="Let AI draft the policies and procedures you don't have yet."
          />
          <ActionLink
            href="/dashboard/gap-assessment"
            title="Run gap assessment"
            description="Walk through every ISO clause and confirm where you stand."
          />
          <ActionLink
            href="/dashboard/consultant-review"
            title="Request consultant review"
            description="Have an ISO consultant review your evidence and documents."
          />
          <ActionLink
            href="/dashboard/reports"
            title="Export readiness report"
            description="Generate a snapshot of your current certification readiness."
          />
        </div>
      </div>
    </StepShell>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string
  value: string
  sublabel?: string
  accent: 'indigo' | 'red' | 'emerald' | 'amber'
}) {
  const colorMap = {
    indigo: 'text-indigo-600',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${colorMap[accent]}`}>{value}</div>
      {sublabel && <div className="text-xs text-gray-500 mt-1 truncate">{sublabel}</div>}
    </div>
  )
}

function ActionLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="block border border-gray-200 rounded-md p-4 hover:border-blue-300 hover:bg-blue-50/30 transition"
    >
      <div className="text-sm font-semibold text-gray-900 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-blue-600 text-base">→</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </Link>
  )
}
