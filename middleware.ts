import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE, cookieIsValid, findAccount, parseAccounts } from '@/lib/demo-access'

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/demo', '/enter', '/api/enter']

function isPublicPath(path: string) {
  if (path === '/') return true // public landing page
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

// ---- Private mode ----------------------------------------------------------
// 1) /demo needs an ID and a password. Visitors enter them on /enter and get a
//    signed cookie. Accounts are set in Vercel (DEMO_ACCOUNTS, or the older
//    DEMO_USER + DEMO_PASSWORD). With no account set, the demo stays CLOSED
//    (fail closed, never open by accident). A browser pop-up login (HTTP
//    Basic) still works too, for tools.
//    To open the demo to everyone, set DEMO_PUBLIC=true. Remove it (or set it
//    to anything else) to close it again.
// 2) /register is closed unless REGISTRATION_OPEN=true. This only hides the
//    page. The real lock is switching off "Allow new users to sign up" in
//    Supabase (Authentication settings), because the sign-up call itself is
//    public.

async function checkDemoAccess(request: NextRequest): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== 'production') return null // local testing stays easy
  if (process.env.DEMO_PUBLIC === 'true') return null // switched on: the demo is open to everyone
  const accounts = parseAccounts(process.env)
  const url = request.nextUrl.clone()
  url.search = ''
  url.username = ''
  url.password = ''
  if (accounts.length === 0) {
    url.pathname = '/enter'
    url.search = '?closed=1'
    return NextResponse.redirect(url)
  }
  if (await cookieIsValid(request.cookies.get(DEMO_COOKIE)?.value, accounts)) return null
  const header = request.headers.get('authorization') ?? ''
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6))
      const i = decoded.indexOf(':')
      if (i >= 0 && findAccount(accounts, decoded.slice(0, i), decoded.slice(i + 1))) return null
    } catch {
      // fall through to the entrance page
    }
  }
  url.pathname = '/enter'
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const firstPath = request.nextUrl.pathname
  if (firstPath === '/demo' || firstPath.startsWith('/demo/')) {
    const denied = await checkDemoAccess(request)
    if (denied) return denied
  }
  if (firstPath === '/register' && process.env.REGISTRATION_OPEN !== 'true') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?invite=1'
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname
  const isPublic = isPublicPath(path)

  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (err) {
    console.error('[middleware] supabase.auth.getUser() threw:', err)
    // Dev convenience: local TLS/network hiccups shouldn't lock you out.
    // In production this must FAIL CLOSED — letting unauthenticated
    // requests through on an auth-service error is an open door.
    if (process.env.NODE_ENV !== 'production') {
      return response
    }
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return response
  }

  if (!user && !isPublic) {
    console.log('[middleware] no user → redirecting to /login from', path)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (path === '/' || path === '/login' || path === '/register')) {
    console.log('[middleware] user already signed in → redirecting to /dashboard')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
}
