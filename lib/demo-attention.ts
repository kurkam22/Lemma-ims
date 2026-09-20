// Sample "needs your attention" items for the public demo and for empty
// workspaces. Dates are relative to today so the demo never shows a date
// that has quietly slipped into the past.
//
// These are SAMPLE records for the fictional company in demo-data.ts.
// They run through the same buildAttention() logic as real company data.

import { buildAttention, type AttentionItem } from '@/lib/attention'
import { buildActivity, buildPulse, type ActivityItem, type PulseRow } from '@/lib/pulse'

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

function stamp(today: Date, minusDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - minusDays, 9, 0, 0)
  return d.toISOString()
}

// Sample records behind the demo's "Last 30 days" and "Recent activity".
function demoRows(today: Date) {
  return {
    issues: [
      { id: 'a', issue_no: 9, title: 'Label mismatch on carton', created_at: stamp(today, 20), closed_at: stamp(today, 15) },
      { id: 'b', issue_no: 10, title: 'Late delivery from a supplier', created_at: stamp(today, 8), closed_at: stamp(today, 3) },
      { id: 'c', issue_no: 11, title: 'Damaged packaging on a shipment', created_at: stamp(today, 1), closed_at: null },
      { id: 'd', issue_no: 8, title: 'Wrong part number on a drawing', created_at: stamp(today, 45), closed_at: stamp(today, 40) },
    ],
    capas: [
      { id: 'x', description: 'Packaging procedure updated', created_at: stamp(today, 25), closed_at: stamp(today, 2) },
      { id: 'y', description: 'Supplier re-evaluation', created_at: stamp(today, 5), closed_at: null },
    ],
  }
}

export function getDemoPulse(today: Date = new Date()): PulseRow[] {
  const r = demoRows(today)
  return buildPulse(today, r.issues, r.capas)
}

export function getDemoActivity(today: Date = new Date()): ActivityItem[] {
  const r = demoRows(today)
  return buildActivity(r.issues, r.capas)
}
