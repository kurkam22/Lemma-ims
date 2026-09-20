// The Certificate clock: turns the company's certificate dates and its real
// audit and review records into positions on three rings (one per year of the
// certificate). Pure logic, no database and no React, so it can be tested.
//
// Nothing here is invented. Every marker is a record the company entered:
// external audits (entered on the Certificate page), internal audits (the
// Internal audits page) and management reviews (the Management review page).

import { daysUntil } from '@/lib/attention'
import { translate, type Locale } from '@/lib/i18n'

export type ClockKind = 'external' | 'internal' | 'review'

export type ClockInput = {
  today: Date
  issuedOn: string // YYYY-MM-DD, the certificate anniversary
  expiresOn: string
  external: { id: string; kind: 'initial' | 'surveillance' | 'recertification'; planned_date: string; status: string }[]
  internal: { id: string; title: string | null; department: string; scheduled_date: string | null; status: string }[]
  reviews: { id: string; review_date: string | null; status: string }[]
  /** Language of the labels. Defaults to English. */
  locale?: Locale
}

export type ClockEvent = {
  id: string
  kind: ClockKind
  label: string
  sub: string
  date: string
  done: boolean
  daysLeft: number
  /** 0, 1 or 2 = year 1, 2 or 3 of the certificate. null = outside the certificate period. */
  ring: 0 | 1 | 2 | null
  /** Degrees clockwise from the top (the certificate anniversary). */
  angle: number | null
}

export type ClockModel = {
  events: ClockEvent[]
  next: ClockEvent | null
  todayRing: 0 | 1 | 2 | null
  todayAngle: number | null
  ticks: number[]
  months: { label: string; angle: number }[]
  daysToExpiry: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayNum(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return NaN
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000)
}

function parts(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? [Number(m[1]), Number(m[2]) - 1, Number(m[3])] : null
}

/** The day number of the k-th anniversary of the certificate. */
function anniversary(issuedOn: string, k: number): number {
  const p = parts(issuedOn)
  if (!p) return NaN
  return Math.round(Date.UTC(p[0] + k, p[1], p[2]) / 86_400_000)
}

/** Where a date sits on the rings: which year of the certificate, and how far round. */
export function place(dateIso: string, issuedOn: string, expiresOn: string): { ring: 0 | 1 | 2 | null; angle: number | null } {
  const d = dayNum(dateIso)
  const end = dayNum(expiresOn)
  if (Number.isNaN(d) || Number.isNaN(end) || d > end) return { ring: null, angle: null }
  for (const k of [0, 1, 2] as const) {
    const a0 = anniversary(issuedOn, k)
    const a1 = anniversary(issuedOn, k + 1)
    if (Number.isNaN(a0) || Number.isNaN(a1)) break
    if (d >= a0 && d < a1) return { ring: k, angle: ((d - a0) / (a1 - a0)) * 360 }
  }
  return { ring: null, angle: null }
}

const EXTERNAL_KEY = {
  initial: 'att.audit.initial',
  surveillance: 'att.audit.surveillance',
  recertification: 'att.audit.recertification',
} as const

export function buildClock(input: ClockInput): ClockModel {
  const { today, issuedOn, expiresOn } = input
  const locale: Locale = input.locale ?? 'en'
  const events: ClockEvent[] = []
  const add = (e: Omit<ClockEvent, 'daysLeft' | 'ring' | 'angle'>) => {
    const left = daysUntil(e.date, today)
    if (left === null) return
    const p = place(e.date, issuedOn, expiresOn)
    events.push({ ...e, daysLeft: left, ring: p.ring, angle: p.angle })
  }

  for (const a of input.external) {
    if (a.status === 'cancelled') continue
    add({ id: `ext-${a.id}`, kind: 'external', label: translate(locale, EXTERNAL_KEY[a.kind]), sub: translate(locale, 'clock.sub.external'), date: a.planned_date, done: a.status === 'done' })
  }
  for (const a of input.internal) {
    if (!a.scheduled_date || a.status === 'cancelled') continue
    add({ id: `int-${a.id}`, kind: 'internal', label: translate(locale, 'clock.ev.internal'), sub: a.title?.trim() || a.department, date: a.scheduled_date, done: a.status === 'completed' })
  }
  for (const r of input.reviews) {
    if (!r.review_date) continue
    add({ id: `rev-${r.id}`, kind: 'review', label: translate(locale, 'clock.ev.review'), sub: translate(locale, 'clock.sub.review'), date: r.review_date, done: r.status === 'completed' })
  }
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)))

  const next = events.find((e) => !e.done && e.daysLeft >= 0) ?? null

  // Month ticks for the first ring: the 1st of each month after the anniversary.
  const start = anniversary(issuedOn, 0)
  const yearLen = anniversary(issuedOn, 1) - start
  const s = /^(\d{4})-(\d{2})/.exec(issuedOn)
  const ticks: number[] = []
  const boundaries: { angle: number; month: number }[] = []
  if (s) {
    const y = Number(s[1])
    const m = Number(s[2]) - 1
    for (let i = 1; i <= 13; i++) {
      const first = Math.round(Date.UTC(y, m + i, 1) / 86_400_000)
      const angle = ((first - start) / yearLen) * 360
      if (angle >= 360) break
      boundaries.push({ angle, month: (m + i) % 12 })
      ticks.push(angle)
    }
  }
  const months: { label: string; angle: number }[] = []
  for (let i = 0; i + 1 < boundaries.length; i++) {
    months.push({ label: locale === 'ko' ? `${boundaries[i].month + 1}월` : MONTHS[boundaries[i].month], angle: (boundaries[i].angle + boundaries[i + 1].angle) / 2 })
  }

  const t = place(toIso(today), issuedOn, expiresOn)
  return {
    events,
    next,
    todayRing: t.ring,
    todayAngle: t.angle,
    ticks,
    months,
    daysToExpiry: daysUntil(expiresOn, today) ?? 0,
  }
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Break a label into at most two lines for the centre of the clock. */
export function splitLabel(label: string): [string, string] {
  if (label.length <= 14 || !label.includes(' ')) return [label, '']
  const mid = label.length / 2
  let best = -1
  for (let i = 0; i < label.length; i++) {
    if (label[i] === ' ' && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
  }
  return [label.slice(0, best), label.slice(best + 1)]
}
