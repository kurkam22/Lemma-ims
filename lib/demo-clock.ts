// A sample certificate for the fictional company, with dates relative to
// today so the sample clock never looks stale.

import { buildClock, type ClockModel } from '@/lib/certclock'
import type { Locale } from '@/lib/i18n'

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getDemoClock(today: Date = new Date(), locale: Locale = 'en'): { model: ClockModel; expiresOn: string } {
  const issued = addDays(today, -310) // certified about ten months ago
  const at = (days: number) => iso(addDays(issued, days))
  const expiresOn = iso(new Date(issued.getFullYear() + 3, issued.getMonth(), issued.getDate() - 1))
  const production = locale === 'ko' ? '생산' : 'Production'
  const purchasing = locale === 'ko' ? '구매' : 'Purchasing'
  const sales = locale === 'ko' ? '영업' : 'Sales'
  const model = buildClock({
    today,
    locale,
    issuedOn: iso(issued),
    expiresOn,
    external: [
      { id: 'e1', kind: 'initial', planned_date: at(0), status: 'done' },
      { id: 'e2', kind: 'surveillance', planned_date: at(339), status: 'planned' },
      { id: 'e3', kind: 'surveillance', planned_date: at(365 + 339), status: 'planned' },
      { id: 'e4', kind: 'recertification', planned_date: at(365 * 2 + 308), status: 'planned' },
    ],
    internal: [
      { id: 'i1', title: null, department: production, scheduled_date: at(287), status: 'completed' },
      { id: 'i2', title: null, department: purchasing, scheduled_date: at(365 + 287), status: 'planned' },
      { id: 'i3', title: null, department: sales, scheduled_date: at(365 * 2 + 233), status: 'planned' },
    ],
    reviews: [
      { id: 'r1', review_date: at(209), status: 'completed' },
      { id: 'r2', review_date: at(365 + 209), status: 'draft' },
      { id: 'r3', review_date: at(365 * 2 + 209), status: 'draft' },
    ],
  })
  return { model, expiresOn }
}
