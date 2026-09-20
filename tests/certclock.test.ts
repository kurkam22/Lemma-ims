// Run with:  npx tsx tests/certclock.test.ts
import assert from 'node:assert/strict'
import { buildClock, place, splitLabel } from '../lib/certclock'

const today = new Date(2026, 8, 21) // 21 Sep 2026
const issued = '2025-11-15'
const expires = '2028-11-14'

// placement
assert.deepEqual(place('2025-11-15', issued, expires), { ring: 0, angle: 0 })
const p1 = place('2026-05-16', issued, expires) // 182 days into year 1
assert.equal(p1.ring, 0); assert.ok(Math.abs(p1.angle! - 179.5) < 1)
const p2 = place('2026-11-15', issued, expires) // one year in -> year 2, near the top
assert.equal(p2.ring, 1); assert.equal(p2.angle, 0)
assert.equal(place('2027-10-19', issued, expires).ring, 1)
assert.equal(place('2028-09-18', issued, expires).ring, 2)
assert.deepEqual(place('2025-11-14', issued, expires), { ring: null, angle: null }, 'before the certificate')
assert.deepEqual(place('2028-12-01', issued, expires), { ring: null, angle: null }, 'after the certificate')
assert.deepEqual(place('garbage', issued, expires), { ring: null, angle: null })

// same season, same angle in different years
const a1 = place('2026-10-20', issued, expires).angle!
const a2 = place('2027-10-19', issued, expires).angle!
assert.ok(Math.abs(a1 - a2) < 2, 'audit season lines up across rings')

const clock = buildClock({
  today, issuedOn: issued, expiresOn: expires,
  external: [
    { id: 'e1', kind: 'initial', planned_date: '2025-11-15', status: 'done' },
    { id: 'e2', kind: 'surveillance', planned_date: '2026-10-20', status: 'planned' },
    { id: 'e3', kind: 'surveillance', planned_date: '2027-10-19', status: 'planned' },
    { id: 'e4', kind: 'recertification', planned_date: '2028-09-18', status: 'planned' },
    { id: 'e5', kind: 'surveillance', planned_date: '2026-09-25', status: 'cancelled' },
  ],
  internal: [
    { id: 'i1', title: null, department: 'Production', scheduled_date: '2026-09-08', status: 'completed' },
    { id: 'i2', title: 'Purchasing', department: 'Purchasing', scheduled_date: null, status: 'planned' },
  ],
  reviews: [
    { id: 'r1', review_date: '2026-06-12', status: 'completed' },
    { id: 'r2', review_date: '2027-06-10', status: 'draft' },
  ],
})
assert.equal(clock.events.length, 7, 'cancelled and undated are left out')
assert.deepEqual(clock.events.map((e) => e.date), [...clock.events.map((e) => e.date)].sort())
assert.equal(clock.next?.label, 'Surveillance audit')
assert.equal(clock.next?.date, '2026-10-20')
assert.equal(clock.next?.daysLeft, 29)
assert.equal(clock.todayRing, 0)
assert.ok(clock.todayAngle! > 300 && clock.todayAngle! < 312)
assert.equal(clock.events.find((e) => e.id === 'int-i1')!.done, true)
assert.equal(clock.events.find((e) => e.id === 'rev-r2')!.done, false)
assert.equal(clock.months.length, 11, 'full months only')
assert.equal(clock.months[0].label, 'Dec')
assert.equal(clock.months[10].label, 'Oct')
assert.equal(clock.daysToExpiry, 785)

// nothing planned -> no "next", no crash
const bare = buildClock({ today, issuedOn: issued, expiresOn: expires, external: [], internal: [], reviews: [] })
assert.equal(bare.next, null); assert.equal(bare.events.length, 0)

// labels
assert.deepEqual(splitLabel('Internal audit'), ['Internal audit', ''])
assert.deepEqual(splitLabel('Recertification audit'), ['Recertification', 'audit'])
assert.deepEqual(splitLabel('Initial certification audit'), ['Initial', 'certification audit'])
console.log('certclock tests passed')
