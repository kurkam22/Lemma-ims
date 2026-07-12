export const REMINDER_KINDS = [
  { id: 'capa', label: 'Corrective action due' },
  { id: 'audit', label: 'Internal / external audit' },
  { id: 'document_review', label: 'Document review' },
  { id: 'training', label: 'Training / re-training' },
  { id: 'certificate', label: 'Certificate / surveillance date' },
  { id: 'management_review', label: 'Management review' },
  { id: 'custom', label: 'Other' },
] as const

export type ReminderKind = (typeof REMINDER_KINDS)[number]['id']

export type Reminder = {
  id: string
  company_id: string
  title: string
  kind: ReminderKind
  due_date: string
  notify_days_before: number
  notes: string | null
  status: 'open' | 'done'
  last_notified_at: string | null
  created_at: string
}

export function kindLabel(id: string): string {
  return REMINDER_KINDS.find((k) => k.id === id)?.label ?? 'Other'
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}
