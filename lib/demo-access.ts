// Entrance to the private demo with an ID and a password.
//
// Accounts come from the Vercel setting DEMO_ACCOUNTS, for example
//     attorney:Hd83kQ2mZ, oasis:Pw47xN9aB
// (ID:password, separated by commas). The old DEMO_USER + DEMO_PASSWORD pair
// still works. Use letters and numbers only.
//
// After a correct ID and password the visitor gets a signed cookie for 7 days.
// The cookie is signed with a key made from the accounts themselves, so
// removing an account or changing a password logs that guest out at once.
//
// This uses only the Web Crypto API, so it runs in both the middleware and the
// API route.

export type Account = { id: string; password: string }

export const DEMO_COOKIE = 'lemma_demo'
export const DEMO_DAYS = 7

export function parseAccounts(env: Record<string, string | undefined>): Account[] {
  const out: Account[] = []
  for (const raw of (env.DEMO_ACCOUNTS ?? '').split(/[\n;,]+/)) {
    const part = raw.trim()
    const i = part.indexOf(':')
    if (i <= 0 || i === part.length - 1) continue
    out.push({ id: part.slice(0, i).trim(), password: part.slice(i + 1).trim() })
  }
  if (env.DEMO_USER && env.DEMO_PASSWORD) out.push({ id: env.DEMO_USER, password: env.DEMO_PASSWORD })
  return out.filter((a) => a.id && a.password)
}

/** Compare two texts without stopping at the first difference. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

/** The account that matches an ID and password, or null. IDs ignore capital letters. */
export function findAccount(accounts: Account[], id: string, password: string): Account | null {
  let found: Account | null = null
  for (const a of accounts) {
    const idOk = safeEqual(a.id.toLowerCase(), id.trim().toLowerCase())
    const pwOk = safeEqual(a.password, password)
    if (idOk && pwOk) found = a
  }
  return found
}

export function secretFor(accounts: Account[]): string {
  return 'lemma-demo-v1|' + accounts.map((a) => `${a.id.toLowerCase()}:${a.password}`).sort().join('|')
}

const enc = new TextEncoder()

function toB64Url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64Url(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return toB64Url(new Uint8Array(sig))
}

export type Token = { id: string; exp: number }

export async function signToken(t: Token, secret: string): Promise<string> {
  const body = toB64Url(enc.encode(JSON.stringify(t)))
  return `${body}.${await hmac(body, secret)}`
}

/** The token's contents, or null when it is forged, damaged or out of date. */
export async function verifyToken(token: string, secret: string, nowSeconds: number = Date.now() / 1000): Promise<Token | null> {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  if (!safeEqual(await hmac(body, secret), sig)) return null
  try {
    const t = JSON.parse(new TextDecoder().decode(fromB64Url(body))) as Token
    if (typeof t.id !== 'string' || typeof t.exp !== 'number' || t.exp <= nowSeconds) return null
    return t
  } catch {
    return null
  }
}

/** True when this cookie belongs to an account that still exists. */
export async function cookieIsValid(token: string | undefined, accounts: Account[], nowSeconds?: number): Promise<boolean> {
  if (!token || accounts.length === 0) return false
  const t = await verifyToken(token, secretFor(accounts), nowSeconds)
  return !!t && accounts.some((a) => a.id.toLowerCase() === t.id.toLowerCase())
}
