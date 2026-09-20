// Run with:  npx tsx tests/pulse.test.ts
import assert from 'node:assert/strict'
import { buildPulse, buildActivity, whenLabel } from '../lib/pulse'

const today = new Date(2026, 8, 20) // 20 Sep 2026
const at = (daysAgo: number) => new Date(2026, 8, 20 - daysAgo, 9).toISOString()

// nothing in -> no invented numbers, no trend arrows
const empty = buildPulse(today, [], [])
assert.deepEqual(empty.map((r) => [r.value, r.delta]), [[0, null], [0, null], [0, null]])

const issues = [
  { created_at: at(2), closed_at: at(1) },   // this window: reported + closed
  { created_at: at(10), closed_at: null },   // this window: reported
  { created_at: at(29), closed_at: null },   // last day of window
  { created_at: at(30), closed_at: at(35) }, // previous window: both
  { created_at: at(70), closed_at: null },   // too old: ignored
]
const capas = [{ created_at: at(5), closed_at: at(4) }, { created_at: at(50), closed_at: at(45) }]
const [rep, clo, capa] = buildPulse(today, issues, capas)
assert.equal(rep.value, 3); assert.equal(rep.delta, 2)   // 3 now vs 1 before
assert.equal(clo.value, 1); assert.equal(clo.delta, 0)   // 1 now vs 1 before
assert.equal(capa.value, 1); assert.equal(capa.delta, 0)
assert.equal(rep.good, 'down'); assert.equal(clo.good, 'up')

// labels
assert.equal(whenLabel(at(0), today), 'Today')
assert.equal(whenLabel(at(1), today), 'Yesterday')
assert.equal(whenLabel(at(4), today), '4 days ago')
assert.equal(whenLabel(at(12), today), '8 Sep 2026') // year always shown

// activity: newest first, capped, both kinds
const act = buildActivity(
  [
    { id: '1', issue_no: 4, title: 'Late delivery', created_at: at(6), closed_at: at(1) },
    { id: '2', issue_no: 5, title: 'Damaged box', created_at: at(0), closed_at: null },
  ],
  [{ id: 'c', description: null, created_at: at(3), closed_at: null }],
  3
)
assert.equal(act.length, 3)
assert.deepEqual(act.map((a) => a.id), ['i-new-2', 'i-closed-1', 'c-new-c'])
assert.equal(act[0].text, 'ISS-0005 reported: Damaged box')
assert.equal(act[1].tone, 'ok')
assert.equal(act[2].text, 'Corrective action opened: Corrective action')
assert.deepEqual(buildActivity([], []), [])
// Korean
assert.equal(whenLabel(at(0), today, 'ko'), '오늘')
assert.equal(whenLabel(at(4), today, 'ko'), '4일 전')
assert.equal(whenLabel(at(12), today, 'ko'), '2026년 9월 8일')
assert.deepEqual(buildPulse(today, [], [], 'ko').map((r) => r.label), ['보고된 문제', '종료된 문제', '종료된 시정조치'])
const koAct = buildActivity([{ id: '1', issue_no: 4, title: '납품 지연', created_at: at(0), closed_at: null }], [], 5, 'ko')
assert.equal(koAct[0].text, 'ISS-0004 보고: 납품 지연')
console.log('pulse tests passed')
