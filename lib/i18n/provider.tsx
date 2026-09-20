'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { translate, translateCount, type Locale, type MessageKey } from '@/lib/i18n'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** t('key', { name: 'x' }) — text in the chosen language. */
export function useT() {
  const locale = useLocale()
  const t = useCallback((key: MessageKey, params?: Record<string, string | number>) => translate(locale, key, params), [locale])
  const tc = useCallback((key: string, count: number, params?: Record<string, string | number>) => translateCount(locale, key, count, params), [locale])
  return useMemo(() => ({ t, tc, locale }), [t, tc, locale])
}
