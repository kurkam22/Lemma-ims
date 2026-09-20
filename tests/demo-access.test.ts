// Run with:  npx tsx tests/demo-access.test.ts
import assert from 'node:assert/strict'
import { cookieIsValid, findAccount, parseAccounts, safeEqual, secretFor, signToken, verifyToken } from '../lib/demo-access'

// reading the accounts
assert.deepEqual(parseAccounts({}), [])
assert.deepEqual(parseAccounts({ DEMO_ACCOUNTS: 'attorney:Abc123, oasis:Xyz789' }), [
  { id: 'attorney', password: 'Abc123' },
  { id: 'oasis', password: 'Xyz789' },
])
assert.deepEqual(parseAccounts({ DEMO_ACCOUNTS: 'a:1;b:2\nc:3' }).map((a) => a.id), ['a', 'b', 'c'])
assert.deepEqual(parseAccounts({ DEMO_ACCOUNTS: 'nocolon, :nopw, noid:, ok:yes' }), [{ id: 'ok', password: 'yes' }])
assert.deepEqual(parseAccounts({ DEMO_ACCOUNTS: 'p:with:colons' }), [{ id: 'p', password: 'with:colons' }])
assert.deepEqual(parseAccounts({ DEMO_USER: 'old', DEMO_PASSWORD: 'pw' }), [{ id: 'old', password: 'pw' }], 'older pair still works')
assert.equal(parseAccounts({ DEMO_USER: 'old' }).length, 0, 'a lone user name is not an account')
assert.equal(parseAccounts({ DEMO_ACCOUNTS: 'a:1', DEMO_USER: 'b', DEMO_PASSWORD: '2' }).length, 2)

// checking an ID and password
const accounts = parseAccounts({ DEMO_ACCOUNTS: 'attorney:Abc123,oasis:Xyz789' })
assert.equal(findAccount(accounts, 'attorney', 'Abc123')?.id, 'attorney')
assert.equal(findAccount(accounts, ' Attorney ', 'Abc123')?.id, 'attorney', 'ID ignores capitals and spaces')
assert.equal(findAccount(accounts, 'attorney', 'abc123'), null, 'password is exact')
assert.equal(findAccount(accounts, 'attorney', 'Xyz789'), null, 'wrong pair')
assert.equal(findAccount(accounts, '', ''), null)
assert.equal(findAccount([], 'a', 'b'), null)
assert.ok(safeEqual('abc', 'abc') && !safeEqual('abc', 'abd') && !safeEqual('abc', 'abcd'))

async function main() {
  const secret = secretFor(accounts)
  const now = 1_800_000_000
  const token = await signToken({ id: 'attorney', exp: now + 1000 }, secret)
  assert.deepEqual(await verifyToken(token, secret, now), { id: 'attorney', exp: now + 1000 })
  assert.equal(await verifyToken(token, secret, now + 2000), null, 'expired')
  assert.equal(await verifyToken(token, 'another secret', now), null, 'wrong key')
  const [body, sig] = token.split('.')
  const forged = Buffer.from(JSON.stringify({ id: 'admin', exp: now + 999999 })).toString('base64url')
  assert.equal(await verifyToken(`${forged}.${sig}`, secret, now), null, 'changed contents')
  assert.equal(await verifyToken(`${body}.x${sig}`, secret, now), null, 'changed signature')
  assert.equal(await verifyToken('garbage', secret, now), null)
  assert.equal(await verifyToken('', secret, now), null)

  // the cookie is valid only while the account exists with the same password
  assert.equal(await cookieIsValid(token, accounts, now), true)
  assert.equal(await cookieIsValid(undefined, accounts, now), false)
  assert.equal(await cookieIsValid(token, [], now), false, 'no accounts -> closed')
  const withoutAttorney = accounts.filter((a) => a.id !== 'attorney')
  assert.equal(await cookieIsValid(token, withoutAttorney, now), false, 'removed account is logged out')
  const changed = parseAccounts({ DEMO_ACCOUNTS: 'attorney:NewPass9,oasis:Xyz789' })
  assert.equal(await cookieIsValid(token, changed, now), false, 'changed password logs the guest out')
  console.log('demo-access tests passed')
}
main()
