// Run with:  npx tsx tests/requirements.test.ts
import assert from 'node:assert/strict'
import { deriveState, docState, nextStep, partOf, summarize, trailOf } from '../lib/requirements'

assert.equal(docState('approved'), 'approved')
assert.equal(docState('in_review'), 'in_review')
assert.equal(docState(undefined), 'missing')
assert.equal(docState('weird'), 'missing')
assert.equal(partOf('10.2'), '10')
assert.equal(partOf('4.1'), '4')

// states
assert.equal(deriveState('not_applicable', 'approved', 3), 'na', 'not applicable wins')
assert.equal(deriveState('gap', 'approved', 3), 'needs', 'a stated gap is needs work')
assert.equal(deriveState('compliant', 'approved', 2), 'ready')
assert.equal(deriveState('user_confirmed', 'approved', 1), 'ready')
assert.equal(deriveState('compliant', 'approved', 0), 'partly', 'no evidence yet')
assert.equal(deriveState('compliant', 'in_review', 4), 'partly', 'document not approved')
assert.equal(deriveState('pending', 'draft', 0), 'partly')
assert.equal(deriveState('pending', 'missing', 2), 'partly', 'evidence but no answer')
assert.equal(deriveState('pending', 'missing', 0), 'notstarted')

// trail
assert.deepEqual(trailOf('compliant', 'draft', 0), { answer: 'done', document: 'draft', evidence: 0 })
assert.deepEqual(trailOf('gap', 'missing', 0), { answer: 'gap', document: 'missing', evidence: 0 })
assert.equal(trailOf('pending', 'missing', 0).answer, 'todo')

// next step follows the order: answer, document, approval, evidence
assert.equal(nextStep('not_applicable', 'missing', 0), null)
assert.equal(nextStep('gap', 'missing', 0)!.labelKey, 'req.next.gap')
assert.equal(nextStep('pending', 'missing', 0)!.labelKey, 'req.next.answer')
assert.equal(nextStep('compliant', 'missing', 0)!.href, '/dashboard/documents/generator')
assert.equal(nextStep('compliant', 'draft', 0)!.labelKey, 'req.next.approve')
assert.equal(nextStep('compliant', 'approved', 0)!.href, '/dashboard/evidence')
assert.equal(nextStep('compliant', 'approved', 2), null, 'nothing left to do')

// counts add up
const c = summarize(['ready', 'ready', 'partly', 'na', 'notstarted', 'needs'])
assert.deepEqual(c, { ready: 2, partly: 1, needs: 1, na: 1, notstarted: 1 })
assert.equal(Object.values(c).reduce((a, b) => a + b, 0), 6)
console.log('requirements tests passed')
