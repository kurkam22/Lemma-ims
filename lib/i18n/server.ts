import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@/lib/i18n/config'

/** Chosen language: the saved choice first, then the browser's language, then English. */
export function getLocale(): Locale {
  const saved = cookies().get(LOCALE_COOKIE)?.value
  if (isLocale(saved)) return saved
  const accept = headers().get('accept-language') ?? ''
  if (/^\s*ko/i.test(accept)) return 'ko'
  return DEFAULT_LOCALE
}
