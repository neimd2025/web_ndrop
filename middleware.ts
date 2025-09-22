import { createClient } from '@/utils/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { supabase, supabaseResponse } = createClient(req)

  // 개발 환경에서만 로깅
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Middleware:', req.nextUrl.pathname)
  }

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 경로 분류
  const protectedRoutes = ['/client', '/home', '/my-page', '/events', '/saved-cards', '/scan-card', '/my-namecard', '/my-qr', '/notifications', '/business-card', '/onboarding']
  const authRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']
  const adminRoutes = ['/admin']
  const adminAuthRoutes = ['/admin/login', '/admin/signup']

  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAdminAuthRoute = adminAuthRoutes.some(route => req.nextUrl.pathname === route)

  const returnTo = req.nextUrl.pathname + req.nextUrl.search

  // 사용자 역할 확인 함수 (한 번만 호출)
  async function getUserRole(userId: string): Promise<number | null> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()

      return profile?.role_id || null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('getUserRole error:', error)
      }
      return null
    }
  }

  // 세션이 있는 경우 역할 정보 미리 조회 (한 번만)
  let userRole: number | null = null
  if (session) {
    userRole = await getUserRole(session.user.id)
  }

  // 1. 루트 경로 처리
  if (req.nextUrl.pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login?type=user', req.url))
    }

    if (userRole === 2) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/client/home', req.url))
    }
  }

  // 2. Admin 경로 접근 제어
  if (isAdminRoute && !isAdminAuthRoute) {
    if (!session || userRole !== 2) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. 로그인된 관리자가 Admin 인증 페이지 접근 시
  if (isAdminAuthRoute && session && userRole === 2) {
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')
    return NextResponse.redirect(new URL(returnToUrl || '/admin/dashboard', req.url))
  }

  // 4. 보호된 경로 접근 제어
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  // 5. 로그인된 사용자가 인증 페이지 접근 시
  if (isAuthRoute && session) {
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')

    if (userRole === 2) {
      return NextResponse.redirect(new URL(returnToUrl || '/admin/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL(returnToUrl || '/client/home', req.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     * - api-docs
     * - .well-known
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api(?!/auth)|api-docs|\\.well-known).*)',
  ],
}
