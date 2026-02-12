import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  
  // 1. Supabase 로그아웃 시도 (서버 세션 종료)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.error("SignOut Error:", error)
  }

  const requestUrl = new URL(req.url)
  const from = requestUrl.searchParams.get('from') || '/'
  const type = requestUrl.searchParams.get('type') || 'user'
  
  // 로그인 페이지 URL 생성
  const loginUrl = new URL('/login', req.url)
  if (from) {
    loginUrl.searchParams.set('from', from)
  }
  if (type) {
    loginUrl.searchParams.set('type', type)
  }
  
  // 2. 응답 생성 및 쿠키 강제 삭제
  const response = NextResponse.redirect(loginUrl)
  
  // 모든 Supabase 관련 쿠키를 만료 처리 (Max-Age=0)
  // Secure, SameSite 설정은 Supabase 기본 설정을 따르거나 여기서 강제할 수 있음
  const cookieOptions = {
    maxAge: 0,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    // domain: '.ndrop.kr' // 필요시 주석 해제하여 도메인 통합
  }

  // Supabase 기본 쿠키 이름들 삭제
  const cookiesToDelete = [
    'sb-access-token',
    'sb-refresh-token',
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token` // 일반적인 Supabase Auth 쿠키 패턴
  ]

  // 요청에 있는 모든 쿠키 중 'sb-'로 시작하는 것들도 삭제 대상에 추가
  req.cookies.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookiesToDelete.push(cookie.name)
    }
  })

  // 중복 제거 후 삭제
  const uniqueCookies = [...new Set(cookiesToDelete)]
  
  uniqueCookies.forEach(name => {
    response.cookies.set(name, '', cookieOptions)
  })

  return response
}