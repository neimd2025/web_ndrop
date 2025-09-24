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
  const protectedRoutes = ['/client', '/home', '/my-page', '/events', '/saved-cards', '/my-namecard', '/my-qr', '/notifications', '/onboarding']
  const authRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']
  const adminRoutes = ['/admin']
  const adminAuthRoutes = ['/admin/login', '/admin/signup']

  // 공개 명함 페이지와 QR 스캔 페이지는 인증 불필요
  const isPublicBusinessCard = req.nextUrl.pathname.startsWith('/business-card/') && req.nextUrl.pathname.split('/').length === 3
  const isScanCardPage = req.nextUrl.pathname === '/client/scan-card'
  const isEventScanPage = req.nextUrl.pathname === '/client/events/scan'

  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route)) && !isPublicBusinessCard && !isScanCardPage && !isEventScanPage
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAdminAuthRoute = adminAuthRoutes.some(route => req.nextUrl.pathname === route)

  const returnTo = req.nextUrl.pathname

  // 사용자 역할 확인 함수 (캐시 추가)
  const roleCache = new Map<string, number | null>()

  async function getUserRole(userId: string): Promise<number | null> {
    // 캐시에서 먼저 확인
    if (roleCache.has(userId)) {
      return roleCache.get(userId) ?? null
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()

      const roleId = profile?.role_id || null
      // 캐시에 저장 (5분간 유효)
      roleCache.set(userId, roleId)
      setTimeout(() => roleCache.delete(userId), 5 * 60 * 1000)

      return roleId
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('getUserRole error:', error)
      }
      return null
    }
  }

  // 세션이 있는 경우에만 역할 정보 조회
  let userRole: number | null = null
  if (session?.user?.id) {
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

  // 2. Admin 경로 접근 제어 (JWT 토큰 기반)
  if (isAdminRoute && !isAdminAuthRoute) {
    // JWT 토큰 확인
    const adminToken = req.cookies.get('admin_token')?.value
    const adminUser = req.cookies.get('admin_user')?.value

    if (!adminToken || !adminUser) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      const userData = JSON.parse(adminUser)
      if (userData.role_id !== 2) {
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('returnTo', returnTo)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. 로그인된 관리자가 Admin 인증 페이지 접근 시 (JWT 토큰 기반)
  if (isAdminAuthRoute) {
    const adminToken = req.cookies.get('admin_token')?.value
    const adminUser = req.cookies.get('admin_user')?.value

    if (adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser)
        if (userData.role_id === 2) {
          const returnToUrl = req.nextUrl.searchParams.get('returnTo')
          return NextResponse.redirect(new URL(returnToUrl || '/admin/dashboard', req.url))
        }
      } catch (error) {
        // 토큰 파싱 오류 시 무시하고 로그인 페이지로
      }
    }
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
