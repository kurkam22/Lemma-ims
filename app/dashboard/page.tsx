'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CertificationJourney from '@/app/dashboard/_components/certification-journey'
import ComplianceChain from '@/app/dashboard/_components/compliance-chain'
import AiInsights from '@/app/dashboard/_components/ai-insights'
import {
  DEMO_COMPANY,
  DEMO_JOURNEY,
  DEMO_CHAIN,
  DEMO_AI_INSIGHTS,
} from '@/lib/demo-data'

const SETUP_TOTAL_STEPS = 5

const ISO_AREAS: { area: string; prefixes: string[] }[] = [
  { area: 'Context & Leadership', prefixes: ['4.', '5.'] },
  { area: 'Planning', prefixes: ['6.'] },
  { area: 'Support', prefixes: ['7.'] },
  { area: 'Operation', prefixes: ['8.'] },
  { area: 'Performance evaluation', prefixes: ['9.'] },
  { area: 'Improvement', prefixes: ['10.'] },
]

type Severity = 'low' | 'medium' | 'high' | 'critical'

type Priority = {
  id: string
  title: string
  due?: string | null
  severity?: Severity
}

type DashboardData = {
  userName: string
  setupStep: number
  readinessPct: number
  documentsReady: number
  evidenceConfirmed: number
  openCapas: number
  nextAction: { label: string; due: string | null } | null
  priorities: Priority[]
  readinessByArea: { area: string; pct: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('full_name, company_id')
        .eq('id', user.id)
        .maybeSingle()

      const userName = userRow?.full_name || user.email?.split('@')[0] || ''

      if (!userRow?.company_id) {
        if (!cancelled) {
          setData({
            userName,
            setupStep: 0,
            readinessPct: 0,
            documentsReady: 0,
            evidenceConfirmed: 0,
            openCapas: 0,
            nextAction: null,
            priorities: [
              { id: 'setup-1', title: 'Complete company setup to get started' },
              { id: 'setup-2', title: 'Upload your existing policies and procedures' },
              { id: 'setup-3', title: 'Invite team members' },
              { id: 'setup-4', title: 'Define processes and goals' },
              { id: 'setup-5', title: 'Run your first gap assessment' },
            ],
            readinessByArea: ISO_AREAS.map((a) => ({ area: a.area, pct: 0 })),
          })
          setLoading(false)
        }
        return
      }

      const cid = userRow.company_id
      const [companyRes, docsRes, evidenceRes, capasRes, gapsRes] = await Promise.all([
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
          .from('evidence')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', cid)
          .eq('user_confirmed', true),
        supabase
          .from('capas')
          .select('id, description, severity, due_date, status')
          .eq('company_id', cid)
          .in('status', ['open', 'in_progress'])
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('gap_answers').select('clause_id, status').eq('company_id', cid),
      ])

      const gaps = gapsRes.data ?? []
      const compliantTotal = gaps.filter((g) => g.status === 'compliant').length
      const readinessPct = gaps.length > 0 ? Math.round((compliantTotal / gaps.length) * 100) : 0

      const readinessByArea = ISO_AREAS.map(({ area, prefixes }) => {
        const areaGaps = gaps.filter((g) =>
          prefixes.some((p) => g.clause_id?.startsWith(p))
        )
        if (areaGaps.length === 0) return { area, pct: 0 }
        const compliant = areaGaps.filter((g) => g.status === 'compliant').length
        return { area, pct: Math.round((compliant / areaGaps.length) * 100) }
      })

      const capas = capasRes.data ?? []
      const firstWithDue = capas.find((c) => c.due_date)
      const nextAction =
        firstWithDue
          ? { label: firstWithDue.description ?? 'CAPA action', due: firstWithDue.due_date }
          : companyRes.data?.target_date
            ? { label: 'Target certification date', due: companyRes.data.target_date }
            : null

      const priorities: Priority[] = capas.slice(0, 5).map((c) => ({
        id: c.id,
        title: c.description ?? 'Open CAPA',
        due: c.due_date,
        severity: c.severity as Severity,
      }))

      if (!cancelled) {
        setData({
          userName,
          setupStep: companyRes.data?.setup_step ?? 0,
          readinessPct,
          documentsReady: docsRes.count ?? 0,
          evidenceConfirmed: evidenceRes.count ?? 0,
          openCapas: capas.length,
          nextAction,
          priorities,
          readinessByArea,
        })
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!data) {
    return (
      <div className="text-sm text-gray-500">
        Could not load dashboard. Try refreshing the page.
      </div>
    )
  }

  const firstName = data.userName.split(' ')[0]
  const setupComplete = data.setupStep >= SETUP_TOTAL_STEPS

  const usingDemo = data.readinessPct === 0 && data.documentsReady === 0
  const view = usingDemo
    ? {
        readinessPct: DEMO_COMPANY.readinessPct,
        documentsReady: DEMO_COMPANY.documentsReady,
        evidenceConfirmed: DEMO_COMPANY.evidenceConfirmed,
        openCapas: DEMO_COMPANY.openCapa,
        nextLabel: DEMO_COMPANY.nextActionLabel,
        nextDue: DEMO_COMPANY.nextActionDue,
        stage: DEMO_COMPANY.currentStage as 'plan' | 'do' | 'check' | 'act',
      }
    : {
        readinessPct: data.readinessPct,
        documentsReady: data.documentsReady,
        evidenceConfirmed: data.evidenceConfirmed,
        openCapas: data.openCapas,
        nextLabel: data.nextAction?.label ?? '—',
        nextDue: data.nextAction?.due ?? null,
        stage: (!setupComplete
          ? 'plan'
          : data.documentsReady === 0
            ? 'do'
            : data.readinessPct < 80
              ? 'check'
              : 'act') as 'plan' | 'do' | 'check' | 'act',
      }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>
            ISO command centre
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {usingDemo ? DEMO_COMPANY.name : firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            {' · '}
            {usingDemo ? DEMO_COMPANY.standard : 'Your certification readiness'}
          </p>
        </div>
        {usingDemo && (
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--lemma-check-soft)', color: 'var(--lemma-check)' }}
          >
            Sample data — start setup to see your own
          </span>
        )}
      </div>

      {!setupComplete && !usingDemo && (
        <SetupBanner step={data.setupStep} total={SETUP_TOTAL_STEPS} />
      )}

      <CertificationJourney stages={DEMO_JOURNEY} activeStage={view.stage} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Overall readiness" value={`${view.readinessPct}%`} tone="primary" />
        <StatCard label="Documents ready" value={view.documentsReady.toString()} tone="do" />
        <StatCard label="Evidence confirmed" value={view.evidenceConfirmed.toString()} tone="do" />
        <StatCard label="Open CAPA" value={view.openCapas.toString()} tone="danger" />
        <StatCard
          label="Next action due"
          value={view.nextDue ? formatDate(view.nextDue) : '—'}
          sublabel={view.nextLabel}
          tone="check"
        />
      </div>

      <ComplianceChain rows={DEMO_CHAIN} />

      <AiInsights insights={DEMO_AI_INSIGHTS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PrioritiesPanel items={data.priorities} />
        <ReadinessByAreaPanel items={data.readinessByArea} />
      </div>

      <p className="text-[11px] leading-relaxed px-1" style={{ color: 'var(--lemma-mist)' }}>
        AI outputs are based on company-provided information and require human review.
        Lemma IMS is not a certification body and does not guarantee certification.
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string
  value: string
  sublabel?: string
  tone: 'primary' | 'do' | 'check' | 'danger'
}) {
  const colorMap = {
    primary: 'var(--lemma-primary)',
    do: 'var(--lemma-do)',
    check: 'var(--lemma-check)',
    danger: 'var(--lemma-danger)',
  } as const
  return (
    <div className="lemma-card p-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--lemma-mist)' }}>
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1" style={{ color: colorMap[tone] }}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--lemma-slate)' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function KPICard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string
  value: string
  sublabel?: string
  accent: 'blue' | 'indigo' | 'emerald' | 'red' | 'amber'
}) {
  const accentMap: Record<typeof accent, string> = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${accentMap[accent]}`}>{value}</div>
      {sublabel && (
        <div className="text-xs text-gray-500 mt-1 truncate" title={sublabel}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function SetupBanner({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-blue-900">
          Complete company setup
        </div>
        <div className="text-xs text-blue-700 mt-0.5">
          Step {step} of {total} — answer company questions to calculate your ISO
          readiness.
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
        </div>
        <Link
          href="/dashboard/setup"
          className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
        >
          Resume setup →
        </Link>
      </div>
    </div>
  )
}

function PrioritiesPanel({ items }: { items: Priority[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">What to do next</h2>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500 py-6 text-center">
          Nothing urgent. Start your gap assessment to surface priorities.
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">{p.title}</div>
                {p.due && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Due {formatDate(p.due)}
                  </div>
                )}
              </div>
              {p.severity && <SeverityBadge severity={p.severity} />}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
    critical: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${styles[severity]}`}
    >
      {severity}
    </span>
  )
}

function ReadinessByAreaPanel({ items }: { items: { area: string; pct: number }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Readiness by area</h2>
      <div className="space-y-3">
        {items.map((a) => {
          const barColor =
            a.pct >= 75
              ? 'bg-emerald-500'
              : a.pct >= 50
                ? 'bg-blue-500'
                : a.pct >= 25
                  ? 'bg-amber-500'
                  : 'bg-gray-300'
          return (
            <div key={a.area}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700">{a.area}</span>
                <span className="font-medium text-gray-900">{a.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${a.pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      <div>
        <div className="h-7 bg-gray-200 rounded w-72" />
        <div className="h-4 bg-gray-200 rounded w-96 mt-2" />
      </div>

      <div className="h-16 bg-gray-200 rounded-lg" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 h-24">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-16 mt-3" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded mt-3" />
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mt-3">
              <div className="h-3 bg-gray-200 rounded w-32" />
              <div className="h-2 bg-gray-200 rounded mt-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
