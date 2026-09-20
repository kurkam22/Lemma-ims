import { en, ko, type MessageKey } from '@/lib/i18n/messages'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export type { Locale } from '@/lib/i18n/config'
export type { MessageKey } from '@/lib/i18n/messages'

const TABLES: Record<Locale, Record<MessageKey, string>> = { en, ko }

type Params = Record<string, string | number>

function fill(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
}

/** Look up a text and fill in its {words}. Falls back to English if a key is missing. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const text = TABLES[locale]?.[key] ?? TABLES[DEFAULT_LOCALE][key] ?? key
  return fill(text, params)
}

/** For counted things: uses key.one when count is 1, otherwise key.other. */
export function translateCount(locale: Locale, key: string, count: number, params?: Params): string {
  const k = `${key}.${count === 1 ? 'one' : 'other'}` as MessageKey
  return translate(locale, k, { count, ...params })
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "20 Sep 2026" in English, "2026년 9월 20일" in Korean. The year is always shown. */
export function formatDateLocale(iso: string, locale: Locale = 'en'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  if (locale === 'ko') return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`
  return `${Number(m[3])} ${MONTHS_EN[Number(m[2]) - 1]} ${m[1]}`
}

export function intlLocale(locale: Locale): string {
  return locale === 'ko' ? 'ko-KR' : 'en-GB'
}
