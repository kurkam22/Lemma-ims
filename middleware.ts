import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/demo']

function isPublicPath(path: string) {
  if (path === '/') return true // public landing page
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

// ---- Private mode ----------------------------------------------------------
// 1) /demo is protected by a user name and password (HTTP Basic Auth).
//    Set DEMO_USER and DEMO_PASSWORD in Vercel. If either is missing in
//    production the demo stays CLOSED (fail closed, never open by accident).
// 2) /register is closed unless REGISTRATION_OPEN=true. This only hides the
//    page. The real lock is switching off "Allow new users to sign up" in
//    Supabase (Authentication settings), because the sign-up call itself is
//    public.

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function checkDemoAccess(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null // local testing stays easy
  const user = process.env.DEMO_USER
  const pass = process.env.DEMO_PASSWORD
  if (!user || !pass) {
    return new NextResponse('The demo is closed.', { status: 503 })
  }
  const header = request.headers.get('authorization') ?? ''
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6))
      const i = decoded.indexOf(':')
      if (i >= 0 && safeEqual(decoded.slice(0, i), user) && safeEqual(decoded.slice(i + 1), pass)) {
        return null
      }
    } catch {
      // fall through to the password prompt
    }
  }
  return new NextResponse('Password required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Lemma IMS demo", charset="UTF-8"' },
  })
}

export async function middleware(request: NextRequest) {
  const firstPath = request.nextUrl.pathname
  if (firstPath === '/demo' || firstPath.startsWith('/demo/')) {
    const denied = checkDemoAccess(request)
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
