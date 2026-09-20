// Sample "needs your attention" items for the public demo and for empty
// workspaces. Dates are relative to today so the demo never shows a date
// that has quietly slipped into the past.
//
// These are SAMPLE records for the fictional company in demo-data.ts.
// They run through the same buildAttention() logic as real company data.

import { buildAttention, type AttentionItem } from '@/lib/attention'

function iso(today: Date, plusDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + plusDays)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function getDemoAttention(today: Date = new Date()): AttentionItem[] {
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return buildAttention({
    today,
    userNames: { u1: 'Sarah Kim', u2: 'John Park' },
    capas: [
      {
        id: 'c1',
        description: 'Customer complaint: five parts arrived with damaged packaging',
        severity: 'high',
        status: 'in_progress',
        due_date: iso(today, 0),
        responsible_id: 'u1',
      },
      {
        id: 'c2',
        description: 'Supplier evaluation record is missing for ABC Components',
        severity: 'medium',
        status: 'open',
        due_date: iso(today, 3),
        responsible_id: 'u2',
      },
    ],
    audits: [
      { id: 'a1', title: null, department: 'Production', scheduled_date: iso(today, 12), status: 'planned' },
    ],
    suppliers: [
      { id: 's1', name: 'ABC Components', cert_expiry: iso(today, 9), approval_status: 'approved' },
    ],
    trainings: [
      {
        id: 't1',
        kind: 'plan',
        module: 'Operator skills',
        employee_name: null,
        scheduled_month: thisMonth,
        result: null,
        status: 'planned',
      },
    ],
    risks: [
      { id: 'r1', status: 'open', kind: 'risk', treatment: null, review_date: null },
      { id: 'r2', status: 'open', kind: 'risk', treatment: null, review_date: null },
    ],
    reminders: [],
    evidence: [],
    documents: [{ id: 'd1', status: 'in_review' }],
    issues: [
      {
        id: 'i1',
        issue_no: 12,
        title: 'Late delivery of packaging material from ABC Components',
        status: 'new',
        owner_id: null,
        due_date: null,
        created_at: iso(today, -1),
      },
    ],
  })
}
