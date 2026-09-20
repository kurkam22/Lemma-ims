import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE, DEMO_DAYS, findAccount, parseAccounts, secretFor, signToken } from '@/lib/demo-access'

export const dynamic = 'force-dynamic'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Checks the ID and password from the entrance form. Always answers with a
// redirect, so it works in every browser, including phone apps.
export async function POST(req: NextRequest) {
  const accounts = parseAccounts(process.env)
  if (accounts.length === 0) return NextResponse.redirect(new URL('/enter?closed=1', req.url), 303)

  const form = await req.formData()
  const id = String(form.get('id') ?? '')
  const password = String(form.get('password') ?? '')
  const account = findAccount(accounts, id, password)

  if (!account) {
    await wait(700) // slows down guessing
    return NextResponse.redirect(new URL('/enter?error=1', req.url), 303)
  }

  const exp = Math.floor(Date.now() / 1000) + DEMO_DAYS * 86400
  const token = await signToken({ id: account.id, exp }, secretFor(accounts))
  const res = NextResponse.redirect(new URL('/demo', req.url), 303)
  res.cookies.set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_DAYS * 86400,
  })
  return res
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/enter', req.url), 303)
}
