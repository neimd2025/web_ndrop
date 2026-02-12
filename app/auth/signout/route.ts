import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  
  // 1. Supabase 로그아웃 시도 (서버 세션 종료)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // scope: 'local'로 설정하여 현재 기기의 세션만 종료 (다른 기기 로그인 유지)
      // 주의: Supabase JS v2의 signOut은 기본적으로 global일 수 있으나, 
      // 명시적으로 scope 옵션을 지원하는 버전인지 확인 필요. 
      // 지원하지 않는 경우, 아래 코드는 무시되거나 global로 동작할 수 있음.
      // 하지만 가장 안전한 방법은 여기서 signOut을 호출하지 않고 쿠키만 삭제하는 것일 수도 있음.
      // 만약 'suddenly' 문제가 다른 기기의 로그아웃 때문이라면, 여기서 signOut()을 호출하면 안 됨.
      
      // 사용자 경험: "이 기기에서 로그아웃"을 원함.
      // 따라서 쿠키만 삭제하고 서버 측 세션은 만료되도록 두는 것이 나을 수 있음 (Refresh Token 삭제됨).
      // 하지만 보안상 서버에도 알리는 것이 좋음.
      
      await supabase.auth.signOut({ scope: 'local' }) 
    }
  } catch (error) {
    // scope: 'local'이 지원되지 않는 구버전일 경우 에러가 날 수 있으므로 fallback
    try {
        await supabase.auth.signOut()
    } catch (e) {
        console.error("SignOut Error:", e)
    }
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
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`, // 일반적인 Supabase Auth 쿠키 패턴
    'supabase-auth-token' // 가끔 사용되는 별칭
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
    // 1. 현재 도메인에서 삭제
    response.cookies.set(name, '', cookieOptions)
    
    // 2. 루트 도메인(.ndrop.kr)에서도 삭제 시도 (서브도메인 쿠키 꼬임 방지)
    response.cookies.set(name, '', { ...cookieOptions, domain: '.ndrop.kr' })
  })

  return response
}