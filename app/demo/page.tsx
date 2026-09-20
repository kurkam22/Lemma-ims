import Link from 'next/link'
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
import { getDemoActivity, getDemoAttention, getDemoPulse } from '@/lib/demo-attention'
import {
  DEMO_COMPANY,
  DEMO_JOURNEY,
  DEMO_CHAIN,
  DEMO_AI_INSIGHTS,
  DEMO_READINESS_BY_AREA,
} from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Live demo · Lemma IMS',
  description:
    'Explore the Lemma IMS ISO compliance command centre with sample data — no sign-up required.',
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default function PublicDemoPage() {
  return (
    <div style={{ background: 'var(--lemma-canvas)', minHeight: '100vh' }}>
      {/* Public top bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3"
        style={{ background: 'var(--lemma-surface)', borderBottom: '1px solid var(--lemma-line)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ color: 'var(--lemma-ink)' }}>Lemma IMS</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--lemma-check-soft)', color: 'var(--lemma-check)' }}
          >
            Live demo · sample data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 rounded-md"
            style={{ color: 'var(--lemma-slate)' }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{ background: 'var(--lemma-primary)', color: '#fff' }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>
            Your quality system, in one place
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {DEMO_COMPANY.name} · {DEMO_COMPANY.standard} · this is a sample workspace you can explore freely
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <AttentionList items={getDemoAttention()} emptyHref="/register" emptyLabel="Start free" />
          </div>
          <ReadinessCard pct={DEMO_COMPANY.readinessPct} areas={DEMO_READINESS_BY_AREA} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <StandCard
            documentsReady={DEMO_COMPANY.documentsReady}
            evidenceConfirmed={DEMO_COMPANY.evidenceConfirmed}
            openCapas={DEMO_COMPANY.openCapa}
            openIssues={1}
          />
          <PulseCard rows={getDemoPulse()} />
          <ActivityCard items={getDemoActivity()} today={new Date()} />
        </div>

        <CertificationJourney stages={DEMO_JOURNEY} activeStage={DEMO_COMPANY.currentStage} />

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

        <div
          className="lemma-card p-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ background: 'var(--lemma-primary-soft)', border: '1px solid var(--lemma-primary)' }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--lemma-ink)' }}>
              Want this for your company?
            </div>
            <div className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
              Create a free workspace and Lemma AI guides you to certification.
            </div>
          </div>
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2.5 rounded-md whitespace-nowrap"
            style={{ background: 'var(--lemma-primary)', color: '#fff' }}
          >
            Start free
          </Link>
        </div>

        <p className="text-[11px] leading-relaxed px-1" style={{ color: 'var(--lemma-mist)' }}>
          This is a demonstration with sample data. AI outputs are based on company-provided
          information and require human review. Lemma IMS is not a certification body and does
          not guarantee certification.
        </p>
      </main>
    </div>
  )
}
