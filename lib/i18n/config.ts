export type Locale = 'en' | 'ko'
export const LOCALES: Locale[] = ['en', 'ko']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'lemma_lang'

export function isLocale(v: string | undefined | null): v is Locale {
  return v === 'en' || v === 'ko'
}
