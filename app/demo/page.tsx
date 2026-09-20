import Link from 'next/link'
import CertificationJourney from '@/app/dashboard/_components/certification-journey'
import ComplianceChain from '@/app/dashboard/_components/compliance-chain'
import AiInsights from '@/app/dashboard/_components/ai-insights'
import AttentionList from '@/app/dashboard/_components/attention-list'
import ReadinessCard from '@/app/dashboard/_components/readiness-card'
import StandCard from '@/app/dashboard/_components/stand-card'
import PulseCard from '@/app/dashboard/_components/pulse-card'
import ActivityCard from '@/app/dashboard/_components/activity-card'
import { getDemoActivity, getDemoAttention, getDemoPulse } from '@/lib/demo-attention'
import { getDemoChain, getDemoCompanyName, getDemoInsights, getDemoJourney } from '@/lib/demo-i18n'
import ClockPanel from '@/app/dashboard/_components/clock-panel'
import RequirementsPanel from '@/app/dashboard/_components/requirements-panel'
import { getDemoClock } from '@/lib/demo-clock'
import { getDemoBoardRows } from '@/lib/requirement-rows'
import { getLocale } from '@/lib/i18n/server'
import { translate } from '@/lib/i18n'
import LanguageSwitch from '@/app/_components/language-switch'
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
  const locale = getLocale()
  const demoClock = getDemoClock(new Date(), locale)
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(locale, key, params)
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
            {t('demo.badge')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 rounded-md"
            style={{ color: 'var(--lemma-slate)' }}
          >
            {t('demo.signIn')}
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{ background: 'var(--lemma-primary)', color: '#fff' }}
          >
            {t('demo.getStarted')}
          </Link>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>
            {t('dash.title.sample')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {t('demo.sub', { name: getDemoCompanyName(locale), standard: DEMO_COMPANY.standard })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <AttentionList items={getDemoAttention(new Date(), locale)} emptyHref="/register" emptyLabel={t('demo.startFree')} />
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
          <PulseCard rows={getDemoPulse(new Date(), locale)} />
          <ActivityCard items={getDemoActivity(new Date(), locale)} today={new Date()} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <ClockPanel model={demoClock.model} expiresOn={demoClock.expiresOn} today={new Date()} sample />
          <RequirementsPanel rows={getDemoBoardRows(locale)} sample />
        </div>

        <CertificationJourney stages={getDemoJourney(locale)} activeStage={DEMO_COMPANY.currentStage} />

        <ComplianceChain rows={getDemoChain(locale)} />

        <AiInsights insights={getDemoInsights(locale)} />


        <div
          className="lemma-card p-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ background: 'var(--lemma-primary-soft)', border: '1px solid var(--lemma-primary)' }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--lemma-ink)' }}>
              {t('demo.ctaTitle')}
            </div>
            <div className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
              {t('demo.ctaText')}
            </div>
          </div>
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2.5 rounded-md whitespace-nowrap"
            style={{ background: 'var(--lemma-primary)', color: '#fff' }}
          >
            {t('demo.startFree')}
          </Link>
        </div>

        <p className="text-[11px] leading-relaxed px-1" style={{ color: 'var(--lemma-mist)' }}>
          {t('demo.footer')}
        </p>
      </main>
    </div>
  )
}
