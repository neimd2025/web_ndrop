import { createClient } from '@/utils/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { supabase, supabaseResponse } = createClient(req)

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 인증이 필요한 페이지들
  const protectedRoutes = ['/client', '/home', '/my-page', '/events', '/saved-cards', '/scan-card', '/my-namecard', '/my-qr', '/notifications', '/business-card', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // 인증 페이지들
  const authRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Admin 관련 경로들
  const adminRoutes = ['/admin']
  const adminAuthRoutes = ['/admin/login', '/admin/signup']
  const isAdminRoute = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAdminAuthRoute = adminAuthRoutes.some(route => req.nextUrl.pathname === route)

  // 현재 접근하려는 URL을 쿼리 파라미터로 저장
  const returnTo = req.nextUrl.pathname + req.nextUrl.search

  // 사용자 역할 확인 함수
  async function getUserRole(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()

      return profile?.role_id || null
    } catch (error) {
      return null
    }
  }

  // 루트 경로 처리 - 역할에 따른 리다이렉트
  if (req.nextUrl.pathname === '/') {
    if (session) {
      const roleId = await getUserRole(session.user.id)

      if (roleId === 2) {
        // 관리자인 경우
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else {
        // 일반 사용자인 경우 (role_id가 null이거나 2가 아닌 경우)
        return NextResponse.redirect(new URL('/client/home', req.url))
      }
    } else {
      // 로그인되지 않은 경우 사용자 로그인 페이지로
      return NextResponse.redirect(new URL('/login?type=user', req.url))
    }
  }

  // Admin 경로 처리
  if (isAdminRoute && !isAdminAuthRoute) {
    if (!session) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }

    // 세션은 있지만 관리자 권한 확인
    const roleId = await getUserRole(session.user.id)
    if (roleId !== 2) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Admin 인증 페이지에서 이미 로그인된 사용자 처리
  if (isAdminAuthRoute && session) {
    const roleId = await getUserRole(session.user.id)
    if (roleId === 2) {
      const returnToUrl = req.nextUrl.searchParams.get('returnTo')
      return NextResponse.redirect(new URL(returnToUrl || '/admin/dashboard', req.url))
    }
    // 관리자가 아닌 경우 관리자 로그인 페이지에 그대로 유지
  }

  // 일반 사용자 인증 처리
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  // 이미 로그인된 사용자가 인증 페이지 접근 시
  if (isAuthRoute && session) {
    const roleId = await getUserRole(session.user.id)
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')

    if (roleId === 2) {
      // 관리자인 경우
      return NextResponse.redirect(new URL(returnToUrl || '/admin/dashboard', req.url))
    } else {
      // 일반 사용자인 경우
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
