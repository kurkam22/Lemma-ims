// "Last 30 days" and "Recent activity" — built ONLY from records the company
// really has (problems and corrective actions). Nothing here is estimated.

import { daysUntil, formatDate } from '@/lib/attention'
import { issueCode } from '@/lib/issues'

type Stamped = { created_at: string; closed_at: string | null }

export type PulseRow = {
  label: string
  value: number
  /** Change against the 30 days before. null when there is nothing to compare. */
  delta: number | null
  /** Which direction is good news. */
  good: 'up' | 'down'
}

function age(iso: string, today: Date): number | null {
  const d = daysUntil(iso, today)
  return d === null ? null : -d
}
const inWindow = (iso: string | null, today: Date, from: number, to: number) => {
  if (!iso) return false
  const a = age(iso, today)
  return a !== null && a >= from && a <= to
}
function count(items: Stamped[], pick: 'created_at' | 'closed_at', today: Date, from: number, to: number) {
  return items.filter((i) => inWindow(i[pick], today, from, to)).length
}
function row(label: string, cur: number, prev: number, good: 'up' | 'down'): PulseRow {
  return { label, value: cur, delta: cur === 0 && prev === 0 ? null : cur - prev, good }
}

export function buildPulse(today: Date, issues: Stamped[], capas: Stamped[]): PulseRow[] {
  return [
    row('Problems reported', count(issues, 'created_at', today, 0, 29), count(issues, 'created_at', today, 30, 59), 'down'),
    row('Problems closed', count(issues, 'closed_at', today, 0, 29), count(issues, 'closed_at', today, 30, 59), 'up'),
    row('Corrective actions closed', count(capas, 'closed_at', today, 0, 29), count(capas, 'closed_at', today, 30, 59), 'up'),
  ]
}

export type ActivityItem = { id: string; text: string; at: string; tone: 'ok' | 'info' }

/** "Today", "Yesterday", "3 days ago", or a dated label with the year. */
export function whenLabel(iso: string, today: Date): string {
  const a = age(iso, today)
  if (a === null) return ''
  if (a <= 0) return 'Today'
  if (a === 1) return 'Yesterday'
  if (a < 7) return `${a} days ago`
  return formatDate(iso)
}

type IssueAct = { id: string; issue_no: number; title: string; created_at: string; closed_at: string | null }
type CapaAct = { id: string; description: string | null; created_at: string; closed_at: string | null }

export function buildActivity(issues: IssueAct[], capas: CapaAct[], limit = 5): ActivityItem[] {
  const out: ActivityItem[] = []
  for (const i of issues) {
    out.push({ id: `i-new-${i.id}`, text: `${issueCode(i.issue_no)} reported: ${i.title}`, at: i.created_at, tone: 'info' })
    if (i.closed_at) out.push({ id: `i-closed-${i.id}`, text: `${issueCode(i.issue_no)} closed: ${i.title}`, at: i.closed_at, tone: 'ok' })
  }
  for (const c of capas) {
    const name = c.description?.trim() || 'Corrective action'
    out.push({ id: `c-new-${c.id}`, text: `Corrective action opened: ${name}`, at: c.created_at, tone: 'info' })
    if (c.closed_at) out.push({ id: `c-closed-${c.id}`, text: `Corrective action closed: ${name}`, at: c.closed_at, tone: 'ok' })
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, limit)
}
