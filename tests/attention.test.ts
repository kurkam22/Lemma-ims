// Run with:  npx tsx tests/attention.test.ts
import assert from 'node:assert/strict'
import { buildAttention, daysUntil, dueLabel, formatDate } from '../lib/attention'

const today = new Date(2026, 8, 20) // 20 Sep 2026

const empty = {
  today,
  userNames: { u1: 'Sarah Kim' } as Record<string, string>,
  capas: [], audits: [], suppliers: [], trainings: [],
  risks: [], reminders: [], evidence: [], documents: [],
}

// dates
assert.equal(daysUntil('2026-09-20', today), 0)
assert.equal(daysUntil('2026-09-19', today), -1)
assert.equal(daysUntil('2026-10-20', today), 30)
assert.equal(daysUntil('bad', today), null)
assert.equal(formatDate('2026-06-22'), '22 Jun 2026') // year always shown
assert.equal(dueLabel(-3, '2026-09-17'), 'Overdue by 3 days')
assert.equal(dueLabel(0, '2026-09-20'), 'Due today')
assert.equal(dueLabel(1, '2026-09-21'), 'Due tomorrow')
assert.equal(dueLabel(20, '2026-10-10'), 'Due 10 Oct 2026')

// nothing in -> nothing out (no invented items)
assert.deepEqual(buildAttention(empty), [])

// ordering: overdue first, then today, then soon, then undated decision, then upcoming
const items = buildAttention({
  ...empty,
  capas: [
    { id: 'a', description: 'Late fix', severity: 'high', status: 'open', due_date: '2026-09-15', responsible_id: 'u1' },
    { id: 'b', description: 'Later fix', severity: 'low', status: 'in_progress', due_date: '2026-10-10', responsible_id: null },
    { id: 'c', description: 'Closed one', severity: 'low', status: 'closed', due_date: '2026-09-01', responsible_id: null },
    { id: 'd', description: 'Far future', severity: 'low', status: 'open', due_date: '2027-03-01', responsible_id: null },
  ],
  audits: [{ id: 'x', title: null, department: 'Production', scheduled_date: '2026-09-27', status: 'planned' }],
  suppliers: [
    { id: 's1', name: 'ABC', cert_expiry: '2026-09-10', approval_status: 'approved' },
    { id: 's2', name: 'New Co', cert_expiry: null, approval_status: 'pending' },
    { id: 's3', name: 'Blocked', cert_expiry: '2026-09-01', approval_status: 'suspended' },
  ],
  risks: [{ id: 'r', status: 'open', kind: 'risk', treatment: null, review_date: null }],
  documents: [{ id: 'd1', status: 'in_review' }, { id: 'd2', status: 'in_review' }],
})
const ids = items.map((i) => i.id)
assert.ok(!ids.includes('capa-c'), 'closed CAPA must not appear')
assert.ok(!ids.includes('capa-d'), 'CAPA due beyond 30 days must not appear')
assert.ok(!ids.some((i) => i.includes('s3')), 'suspended supplier must not appear')
assert.equal(items[0].urgency, 'overdue')
const urg = items.map((i) => i.urgency)
const rank = { overdue: 0, today: 1, soon: 2, open: 3, upcoming: 4 } as const
for (let i = 1; i < urg.length; i++) assert.ok(rank[urg[i - 1]] <= rank[urg[i]], 'sorted by urgency')
const late = items.find((i) => i.id === 'capa-a')!
assert.equal(late.detail, 'Owner: Sarah Kim · Due 15 Sep 2026')
assert.equal(items.find((i) => i.id === 'documents-in-review')!.title, '2 documents are waiting for approval')
assert.equal(items.find((i) => i.id === 'risks-untreated')!.title, '1 risk has no treatment chosen')

// reminders of kind capa/audit are not duplicated
const rem = buildAttention({
  ...empty,
  reminders: [
    { id: '1', title: 'CAPA follow-up', kind: 'capa', due_date: '2026-09-21', status: 'open' },
    { id: '2', title: 'Renew certificate', kind: 'certificate', due_date: '2026-09-25', status: 'open' },
    { id: '3', title: 'Done already', kind: 'custom', due_date: '2026-09-21', status: 'done' },
  ],
})
assert.deepEqual(rem.map((r) => r.id), ['reminder-2'])

// training: planned this month appears; future month does not
const tr = buildAttention({
  ...empty,
  trainings: [
    { id: 't1', kind: 'plan', module: 'A', employee_name: null, scheduled_month: '2026-09', result: null, status: 'planned' },
    { id: 't2', kind: 'plan', module: 'B', employee_name: null, scheduled_month: '2026-11', result: null, status: 'planned' },
    { id: 't3', kind: 'record', module: 'C', employee_name: 'X', scheduled_month: null, result: 'fail', status: 'completed' },
  ],
})
assert.deepEqual(tr.map((r) => r.id).sort(), ['training-failed', 'training-plans'])

console.log('attention tests passed')
