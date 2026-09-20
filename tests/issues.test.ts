// Run with:  npx tsx tests/issues.test.ts
import assert from 'node:assert/strict'
import { issueCode, makeTitle, suggestClauses, nextSteps, checkPhoto, safeFileName, CAPA_CLAUSE, EDITION } from '../lib/issues'
import { buildAttention } from '../lib/attention'

// codes and titles
assert.equal(issueCode(7), 'ISS-0007')
assert.equal(issueCode(1234), 'ISS-1234')
assert.equal(makeTitle('  Five parts arrived damaged.\nMore detail here'), 'Five parts arrived damaged.')
const long = 'word '.repeat(40)
assert.ok(makeTitle(long).length <= 81 && makeTitle(long).endsWith('…'))
assert.equal(makeTitle('Short'), 'Short')

// clause suggestions: fixed table, numbers only, edition 2015
assert.equal(EDITION, '2015')
assert.deepEqual(suggestClauses('other').map((s) => s.clause), ['8.7'])
assert.deepEqual(suggestClauses('customer_service').map((s) => s.clause), ['8.7', '9.1.2', '8.2.1'])
assert.deepEqual(suggestClauses('supplier').map((s) => s.clause), ['8.7', '8.4'])
assert.deepEqual(suggestClauses('receiving').map((s) => s.clause), ['8.7', '8.4'])
assert.deepEqual(suggestClauses('production').map((s) => s.clause), ['8.7', '8.5.1'])
assert.equal(CAPA_CLAUSE.clause, '10.2')
for (const a of ['receiving', 'production', 'customer_service', 'supplier', 'other'] as const)
  for (const s of suggestClauses(a)) assert.ok(s.why.length > 10 && !/shall/i.test(s.why), 'own words, no "shall"')

// workflow rules
const base = { owner_id: null, action_taken: null, result_check: null }
assert.deepEqual(nextSteps({ ...base, status: 'new' }), [{ to: 'in_progress', ok: false, reason: 'Choose an owner first.' }])
assert.equal(nextSteps({ ...base, status: 'new', owner_id: 'u1' })[0].ok, true)
assert.equal(nextSteps({ ...base, status: 'in_progress', owner_id: 'u1' })[0].ok, false)
assert.equal(nextSteps({ ...base, status: 'in_progress', owner_id: 'u1', action_taken: '  ' })[0].ok, false)
assert.equal(nextSteps({ ...base, status: 'in_progress', owner_id: 'u1', action_taken: 'Replaced pallets' })[0].ok, true)
const resolved = nextSteps({ ...base, status: 'resolved', owner_id: 'u1', action_taken: 'x' })
assert.equal(resolved.find((t) => t.to === 'closed')!.ok, false)
assert.equal(nextSteps({ ...base, status: 'resolved', owner_id: 'u1', action_taken: 'x', result_check: 'Checked 5 pallets' }).find((t) => t.to === 'closed')!.ok, true)
assert.equal(nextSteps({ ...base, status: 'closed' })[0].to, 'in_progress') // can be reopened

// photos
assert.equal(checkPhoto({ type: 'image/png', size: 1000 }), null)
assert.ok(checkPhoto({ type: 'application/pdf', size: 1000 }))
assert.ok(checkPhoto({ type: 'image/jpeg', size: 6 * 1024 * 1024 }))
assert.equal(safeFileName('My Photo (1).JPG'), 'my-photo-1-.jpg')

// attention list picks problems up
const today = new Date(2026, 8, 20)
const input = {
  today, userNames: { u1: 'Sarah Kim' } as Record<string, string>,
  capas: [], audits: [], suppliers: [], trainings: [], risks: [], reminders: [], evidence: [], documents: [],
}
const items = buildAttention({
  ...input,
  issues: [
    { id: 'a', issue_no: 3, title: 'No owner, fresh', status: 'new', owner_id: null, due_date: null, created_at: '2026-09-20T01:00:00Z' },
    { id: 'b', issue_no: 4, title: 'No owner, old', status: 'new', owner_id: null, due_date: null, created_at: '2026-09-15T01:00:00Z' },
    { id: 'c', issue_no: 5, title: 'Overdue', status: 'in_progress', owner_id: 'u1', due_date: '2026-09-17', created_at: '2026-09-10T01:00:00Z' },
    { id: 'd', issue_no: 6, title: 'Awaiting check', status: 'resolved', owner_id: 'u1', due_date: '2026-09-01', created_at: '2026-09-01T01:00:00Z' },
    { id: 'e', issue_no: 7, title: 'Closed one', status: 'closed', owner_id: 'u1', due_date: '2026-09-01', created_at: '2026-09-01T01:00:00Z' },
    { id: 'f', issue_no: 8, title: 'Far future', status: 'in_progress', owner_id: 'u1', due_date: '2027-05-01', created_at: '2026-09-01T01:00:00Z' },
  ],
})
const byId = Object.fromEntries(items.map((i) => [i.id, i]))
assert.ok(!byId['issue-e'], 'closed problem hidden')
assert.ok(!byId['issue-f'], 'problem due beyond 30 days hidden')
assert.equal(byId['issue-a'].urgency, 'open')
assert.equal(byId['issue-a'].actionLabel, 'Choose owner')
assert.equal(byId['issue-b'].urgency, 'soon', 'old unowned problem is pushed up')
assert.equal(byId['issue-c'].urgency, 'overdue')
assert.equal(byId['issue-c'].detail, 'Owner: Sarah Kim · Due 17 Sep 2026')
assert.equal(byId['issue-d'].actionLabel, 'Check result')
assert.equal(byId['issue-d'].title, 'ISS-0006: Awaiting check')
assert.equal(items[0].id, 'issue-c', 'overdue first')

// callers that do not pass issues still work
assert.deepEqual(buildAttention(input), [])
console.log('issues tests passed')
