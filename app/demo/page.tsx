import Link from 'next/link'
import CertificationJourney from '@/app/dashboard/_components/certification-journey'
import ComplianceChain from '@/app/dashboard/_components/compliance-chain'
import AiInsights from '@/app/dashboard/_components/ai-insights'
import {
  DEMO_COMPANY,
  DEMO_JOURNEY,
  DEMO_CHAIN,
  DEMO_AI_INSIGHTS,
} from '@/lib/demo-data'

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
    })
  } catch {
    return d
  }
}

export default function PublicDemoPage() {
  const stats = [
    { label: 'Overall readiness', value: `${DEMO_COMPANY.readinessPct}%`, tone: 'var(--lemma-primary)' },
    { label: 'Documents ready', value: String(DEMO_COMPANY.documentsReady), tone: 'var(--lemma-do)' },
    { label: 'Evidence confirmed', value: String(DEMO_COMPANY.evidenceConfirmed), tone: 'var(--lemma-do)' },
    { label: 'Open CAPA', value: String(DEMO_COMPANY.openCapa), tone: 'var(--lemma-danger)' },
    {
      label: 'Next action due',
      value: formatDate(DEMO_COMPANY.nextActionDue),
      sub: DEMO_COMPANY.nextActionLabel,
      tone: 'var(--lemma-check)',
    },
  ]

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
            ISO command centre
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {DEMO_COMPANY.name} · {DEMO_COMPANY.standard} · this is a sample workspace you can explore freely
          </p>
        </div>

        <CertificationJourney stages={DEMO_JOURNEY} activeStage={DEMO_COMPANY.currentStage} />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="lemma-card p-3.5">
              <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--lemma-mist)' }}>
                {s.label}
              </div>
              <div className="text-2xl font-semibold mt-1" style={{ color: s.tone }}>
                {s.value}
              </div>
              {s.sub && (
                <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--lemma-slate)' }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        <ComplianceChain rows={DEMO_CHAIN} />

        <AiInsights insights={DEMO_AI_INSIGHTS} />

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
