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
  const protectedRoutes = ['/user', '/home', '/my-page', '/namecard', '/events', '/saved-cards', '/scan-card', '/my-namecard', '/my-qr', '/notifications', '/business-card', '/onboarding']
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

  // Admin 경로 처리
  if (isAdminRoute && !isAdminAuthRoute && !session) {
    const redirectUrl = new URL('/admin/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin 인증 페이지에서 이미 로그인된 사용자 처리
  if (isAdminAuthRoute && session) {
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')
    return NextResponse.redirect(new URL(returnToUrl || '/admin/events', req.url))
  }

  // 일반 사용자 인증 처리
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  // 이미 로그인된 사용자가 인증 페이지 접근 시
  if (isAuthRoute && session) {
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')
    return NextResponse.redirect(new URL(returnToUrl || '/user/home', req.url))
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
