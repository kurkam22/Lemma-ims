import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { translate } from '@/lib/i18n'
import LanguageSwitch from '@/app/_components/language-switch'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Enter' }

// The entrance to the private demo. A plain form: no scripts needed, so it
// works in every browser, including the browsers inside phone apps.
export default function EnterPage({ searchParams }: { searchParams: { error?: string; closed?: string } }) {
  // When the demo is open to everyone there is nothing to enter.
  if (process.env.DEMO_PUBLIC === 'true') redirect('/demo')
  const locale = getLocale()
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k)
  const closed = searchParams.closed === '1'
  const error = searchParams.error === '1'

  const inputStyle = { border: '1px solid var(--lemma-line)', background: 'var(--lemma-surface)', color: 'var(--lemma-ink)' } as const

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lemma-canvas)' }}>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3">
        <span className="font-bold" style={{ color: 'var(--lemma-ink)' }}>Lemma IMS</span>
        <LanguageSwitch />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="lemma-card w-full max-w-sm p-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('enter.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lemma-slate)' }}>{closed ? t('enter.closed') : t('enter.sub')}</p>

          {error && (
            <div role="alert" className="mt-4 px-3 py-2.5 rounded-md text-sm" style={{ background: 'var(--lemma-danger-soft)', color: 'var(--lemma-danger)' }}>
              {t('enter.error')}
            </div>
          )}

          {!closed && (
            <form method="post" action="/api/enter" className="mt-5 space-y-4">
              <div>
                <label htmlFor="id" className="block text-sm font-medium mb-1" style={{ color: 'var(--lemma-ink)' }}>{t('enter.id')}</label>
                <input id="id" name="id" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" required className="w-full rounded-md px-3 py-2.5 text-sm" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--lemma-ink)' }}>{t('enter.password')}</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-md px-3 py-2.5 text-sm" style={inputStyle} />
              </div>
              <button type="submit" className="w-full text-sm font-medium py-2.5 rounded-md" style={{ background: 'var(--lemma-primary)', color: '#fff' }}>
                {t('enter.submit')}
              </button>
            </form>
          )}
          <p className="text-xs mt-4" style={{ color: 'var(--lemma-mist)' }}>{t('enter.help')}</p>
        </div>
      </main>
    </div>
  )
}
