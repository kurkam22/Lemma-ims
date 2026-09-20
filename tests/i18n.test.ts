// Run with:  npx tsx tests/i18n.test.ts
import assert from 'node:assert/strict'
import { en, ko } from '../lib/i18n/messages'
import { translate, translateCount, formatDateLocale } from '../lib/i18n'

const HANGUL = /[\u3131-\u318E\uAC00-\uD7A3]/
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',')

// Text that is meant to look the same in both languages.
const SAME_IN_BOTH = new Set(['insights.aiTag', 'att.issue.title'])

const keys = Object.keys(en) as (keyof typeof en)[]
assert.ok(keys.length > 200, 'dictionary is filled in')
assert.deepEqual(Object.keys(ko).sort(), [...keys].sort(), 'every English key has a Korean text')

for (const k of keys) {
  assert.ok(ko[k].trim().length > 0, `empty Korean text: ${k}`)
  assert.equal(placeholders(ko[k]), placeholders(en[k]), `placeholders differ: ${k}`)
  if (!SAME_IN_BOTH.has(k)) {
    assert.ok(HANGUL.test(ko[k]), `Korean text has no Hangul: ${k} -> ${ko[k]}`)
    assert.notEqual(ko[k], en[k], `Korean text is still English: ${k}`)
  }
}

// filling in words
assert.equal(translate('en', 'att.owner', { name: 'Sarah' }), 'Owner: Sarah')
assert.equal(translate('ko', 'att.owner', { name: '김서연' }), '담당자: 김서연')
assert.equal(translate('ko', 'setup.progress', { step: 2, total: 5 }), '5단계 중 2단계 — 회사에 관한 질문에 답하면 ISO 준비도를 계산해 드립니다.')
assert.equal(translateCount('en', 'att.docs', 1), '1 document is waiting for approval')
assert.equal(translateCount('en', 'att.docs', 3), '3 documents are waiting for approval')
assert.equal(translateCount('ko', 'att.docs', 3), '승인 대기 중인 문서 3건')
assert.equal(translate('en', 'card.readinessAria', { pct: 62 }), 'Readiness 62 percent')

// dates: the year is always shown
assert.equal(formatDateLocale('2026-09-20', 'en'), '20 Sep 2026')
assert.equal(formatDateLocale('2026-09-20', 'ko'), '2026년 9월 20일')
assert.equal(formatDateLocale('bad', 'ko'), 'bad')

// no leftover {words} when all parameters are given
assert.ok(!/\{\w+\}/.test(translate('ko', 'dash.hello.morning.named', { name: '민준' })))

console.log('i18n tests passed, ' + keys.length + ' texts in both languages')
