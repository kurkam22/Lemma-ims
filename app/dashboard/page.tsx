'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CertificationJourney from '@/app/dashboard/_components/certification-journey'
import ComplianceChain from '@/app/dashboard/_components/compliance-chain'
import ComplianceMetro from '@/app/dashboard/_components/compliance-metro'
import { DEMO_METRO } from '@/lib/metro-data'
import AiInsights from '@/app/dashboard/_components/ai-insights'
import AttentionList from '@/app/dashboard/_components/attention-list'
import ReadinessCard from '@/app/dashboard/_components/readiness-card'
import StandCard from '@/app/dashboard/_components/stand-card'
import PulseCard from '@/app/dashboard/_components/pulse-card'
import ActivityCard from '@/app/dashboard/_components/activity-card'
import {
  DEMO_COMPANY,
  DEMO_JOURNEY,
  DEMO_CHAIN,
  DEMO_AI_INSIGHTS,
  DEMO_READINESS_BY_AREA,
} from '@/lib/demo-data'
import { getDemoActivity, getDemoAttention, getDemoPulse } from '@/lib/demo-attention'
import { buildActivity, buildPulse, type ActivityItem, type PulseRow } from '@/lib/pulse'
import { buildAttention, type AttentionItem } from '@/lib/attention'

const SETUP_TOTAL_STEPS = 5

const ISO_AREAS: { area: string; prefixes: string[] }[] = [
  { area: 'Context & Leadership', prefixes: ['4.', '5.'] },
  { area: 'Planning', prefixes: ['6.'] },
  { area: 'Support', prefixes: ['7.'] },
  { area: 'Operation', prefixes: ['8.'] },
  { area: 'Performance evaluation', prefixes: ['9.'] },
  { area: 'Improvement', prefixes: ['10.'] },
]

type DashboardData = {
  userName: string
  setupStep: number
  readinessPct: number
  documentsReady: number
  evidenceConfirmed: number
  openCapas: number
  nextAction: { label: string; due: string | null } | null
  attention: AttentionItem[]
  openIssues: number
  pulse: PulseRow[]
  activity: ActivityItem[]
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
            attention: [],
            openIssues: 0,
            pulse: [],
            activity: [],
            readinessByArea: ISO_AREAS.map((a) => ({ area: a.area, pct: 0 })),
          })
          setLoading(false)
        }
        return
      }

      const cid = userRow.company_id
      const [
        companyRes,
        docsRes,
        evidenceRes,
        capasRes,
        gapsRes,
        suppliersRes,
        auditsRes,
        trainingsRes,
        risksRes,
        remindersRes,
        evidenceAllRes,
        docsReviewRes,
        usersRes,
        issuesRes,
        capasRecentRes,
        externalRes,
        certRes,
      ] = await Promise.all([
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
          .select('id, description, severity, due_date, status, responsible_id')
          .eq('company_id', cid)
          .in('status', ['open', 'in_progress'])
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('gap_answers').select('clause_id, status').eq('company_id', cid),
        supabase
          .from('suppliers')
          .select('id, name, cert_expiry, approval_status')
          .eq('company_id', cid),
        supabase
          .from('audits')
          .select('id, title, department, scheduled_date, status')
          .eq('company_id', cid),
        supabase
          .from('trainings')
          .select('id, kind, module, employee_name, scheduled_month, result, status')
          .eq('company_id', cid),
        supabase
          .from('risks')
          .select('id, status, kind, treatment, review_date')
          .eq('company_id', cid),
        supabase
          .from('reminders')
          .select('id, title, kind, due_date, status')
          .eq('company_id', cid)
          .eq('status', 'open'),
        supabase
          .from('evidence')
          .select('id, status, expiry_date')
          .eq('company_id', cid),
        supabase
          .from('documents')
          .select('id, status')
          .eq('company_id', cid)
          .eq('status', 'in_review'),
        supabase.from('users').select('id, full_name').eq('company_id', cid),
        // If the problems table has not been created yet, this returns an
        // error and the dashboard simply shows no problems.
        supabase
          .from('issues')
          .select('id, issue_no, title, status, owner_id, due_date, created_at, closed_at')
          .eq('company_id', cid),
        // Corrective actions opened or closed in the last 60 days, for the
        // "Last 30 days" card and recent activity.
        supabase
          .from('capas')
          .select('id, description, created_at, closed_at')
          .eq('company_id', cid)
          .or(`created_at.gte.${new Date(Date.now() - 60 * 86400000).toISOString()},closed_at.gte.${new Date(Date.now() - 60 * 86400000).toISOString()}`),
        // Certificate and audits by the certification body. If those tables do
        // not exist yet these return an error and are simply left out.
        supabase.from('external_audits').select('id, kind, planned_date, status').eq('company_id', cid),
        supabase.from('certificates').select('expires_on').eq('company_id', cid).eq('standard', 'iso9001').maybeSingle(),
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

      const userNames: Record<string, string> = {}
      for (const u of usersRes.data ?? []) {
        if (u.full_name) userNames[u.id] = u.full_name
      }

      const attention = buildAttention({
        today: new Date(),
        userNames,
        capas: (capasRes.data ?? []).map((c) => ({
          id: c.id,
          description: c.description,
          severity: c.severity,
          status: c.status,
          due_date: c.due_date,
          responsible_id: c.responsible_id,
        })),
        audits: auditsRes.data ?? [],
        suppliers: suppliersRes.data ?? [],
        trainings: trainingsRes.data ?? [],
        risks: risksRes.data ?? [],
        reminders: remindersRes.data ?? [],
        evidence: evidenceAllRes.data ?? [],
        documents: docsReviewRes.data ?? [],
        issues: issuesRes.error ? [] : issuesRes.data ?? [],
        externalAudits: externalRes.error ? [] : externalRes.data ?? [],
        certificate: certRes.error ? null : certRes.data ?? null,
      })
      const issueRows = issuesRes.error ? [] : issuesRes.data ?? []
      const capaRows = capasRecentRes.error ? [] : capasRecentRes.data ?? []
      const now = new Date()
      const pulse = buildPulse(now, issueRows, capaRows)
      const activity = buildActivity(issueRows, capaRows)
      const openIssues = issueRows.filter((i: { status: string }) => i.status !== 'closed').length

      if (!cancelled) {
        setData({
          userName,
          setupStep: companyRes.data?.setup_step ?? 0,
          readinessPct,
          documentsReady: docsRes.count ?? 0,
          evidenceConfirmed: evidenceRes.count ?? 0,
          openCapas: capas.length,
          nextAction,
          attention,
          openIssues,
          pulse,
          activity,
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

  // Show the sample workspace only when the company has no data of its own yet.
  const usingDemo =
    data.readinessPct === 0 && data.documentsReady === 0 && data.attention.length === 0
  const attention = usingDemo ? getDemoAttention() : data.attention
  const view = usingDemo
    ? {
        readinessPct: DEMO_COMPANY.readinessPct,
        documentsReady: DEMO_COMPANY.documentsReady,
        evidenceConfirmed: DEMO_COMPANY.evidenceConfirmed,
        openCapas: DEMO_COMPANY.openCapa,
        stage: DEMO_COMPANY.currentStage as 'plan' | 'do' | 'check' | 'act',
      }
    : {
        readinessPct: data.readinessPct,
        documentsReady: data.documentsReady,
        evidenceConfirmed: data.evidenceConfirmed,
        openCapas: data.openCapas,
        stage: (!setupComplete
          ? 'plan'
          : data.documentsReady === 0
            ? 'do'
            : data.readinessPct < 80
              ? 'check'
              : 'act') as 'plan' | 'do' | 'check' | 'act',
      }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const areas = usingDemo ? DEMO_READINESS_BY_AREA : data.readinessByArea
  const pulseRows = usingDemo ? getDemoPulse() : data.pulse
  const activityItems = usingDemo ? getDemoActivity() : data.activity
  const openIssues = usingDemo ? 1 : data.openIssues

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>
            {usingDemo ? 'Your quality system, in one place' : firstName ? `${greeting}, ${firstName}` : greeting}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {usingDemo
              ? `${DEMO_COMPANY.name} (sample company)`
              : 'Here is what needs your attention and where your quality system stands.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-3 py-1.5 rounded-md"
            style={{ background: 'var(--lemma-surface)', border: '1px solid var(--lemma-line)', color: 'var(--lemma-slate)' }}
          >
            {todayLabel}
          </span>
          {!usingDemo && (
            <Link
              href="/dashboard/issues?new=1"
              className="text-sm font-medium px-4 py-2 rounded-md"
              style={{ background: 'var(--lemma-primary)', color: '#fff' }}
            >
              Report a problem
            </Link>
          )}
        </div>
      </div>

      {usingDemo && (
        <div
          className="text-xs font-medium px-3 py-2 rounded-md"
          style={{ background: 'var(--lemma-check-soft)', color: 'var(--lemma-check)' }}
        >
          Sample data. Start setup to see your own.
        </div>
      )}

      {!setupComplete && !usingDemo && (
        <SetupBanner step={data.setupStep} total={SETUP_TOTAL_STEPS} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <AttentionList
            items={attention}
            emptyHref={setupComplete ? '/dashboard/compliance-check' : '/dashboard/setup'}
            emptyLabel={setupComplete ? 'Run your readiness check' : 'Continue setup'}
          />
        </div>
        <ReadinessCard pct={view.readinessPct} areas={areas} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StandCard
          documentsReady={view.documentsReady}
          evidenceConfirmed={view.evidenceConfirmed}
          openCapas={view.openCapas}
          openIssues={openIssues}
        />
        <PulseCard rows={pulseRows} />
        <ActivityCard items={activityItems} today={new Date()} />
      </div>

      {usingDemo && (
        <>
          <CertificationJourney stages={DEMO_JOURNEY} activeStage={view.stage} />
          <ComplianceChain rows={DEMO_CHAIN} />
          <AiInsights insights={DEMO_AI_INSIGHTS} />
          <details className="lemma-card">
            <summary
              className="px-5 py-3 text-sm font-medium cursor-pointer"
              style={{ color: 'var(--lemma-ink)' }}
            >
              System overview (optional)
            </summary>
            <div className="px-2 pb-2">
              <ComplianceMetro clauses={DEMO_METRO} />
            </div>
          </details>
        </>
      )}

      <p className="text-[11px] leading-relaxed px-1" style={{ color: 'var(--lemma-mist)' }}>
        AI outputs are based on company-provided information and require human review.
        Lemma IMS is not a certification body and does not guarantee certification.
      </p>
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
