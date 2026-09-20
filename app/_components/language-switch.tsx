'use client'

import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config'
import { useT } from '@/lib/i18n/provider'

const OPTIONS: { value: Locale; label: string; aria: string }[] = [
  { value: 'en', label: 'EN', aria: 'English' },
  { value: 'ko', label: '한국어', aria: '한국어' },
]

// Saves the choice in a cookie and reloads, so every screen (server and
// browser) starts in the same language.
export default function LanguageSwitch() {
  const { locale, t } = useT()

  function choose(next: Locale) {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <div
      role="group"
      aria-label={t('top.language')}
      className="flex items-center rounded-md overflow-hidden text-xs"
      style={{ border: '1px solid var(--lemma-line)' }}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => choose(o.value)}
          aria-pressed={locale === o.value}
          aria-label={o.aria}
          className="px-2.5 py-1 font-medium"
          style={
            locale === o.value
              ? { background: 'var(--lemma-primary)', color: '#fff' }
              : { background: 'var(--lemma-surface)', color: 'var(--lemma-slate)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
