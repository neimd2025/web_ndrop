// @ts-nocheck
// middleware.ts
import { createClient } from '@/utils/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
// import { Redis } from '@upstash/redis'

// Redis 클라이언트 초기화 (싱글톤)
let redisClient: any = null

function getRedisClient(): any {
  // Edge Runtime 호환성 문제로 Redis 비활성화
  return {
    get: async () => null,
    setex: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
    info: async () => '',
  }
}

// 메모리 캐시 (짧은 TTL용)
const memoryCache = {
  sessions: new Map<string, { data: any; timestamp: number }>(),
  roles: new Map<string, { roleId: number | null; timestamp: number }>(),
  
  getSession(token: string) {
    const cached = this.sessions.get(token)
    if (cached && Date.now() - cached.timestamp < 30000) { // 30초
      return cached.data
    }
    return null
  },
  
  setSession(token: string, session: any) {
    this.sessions.set(token, { data: session, timestamp: Date.now() })
  },
  
  getRole(userId: string) {
    const cached = this.roles.get(userId)
    if (cached && Date.now() - cached.timestamp < 60000) { // 1분
      return cached.roleId
    }
    return null
  },
  
  setRole(userId: string, roleId: number | null) {
    this.roles.set(userId, { roleId, timestamp: Date.now() })
  }
}

// 정규식 패턴 미리 컴파일
const STATIC_EXT_PATTERN = /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|json|webp|avif|txt|xml)$/
const PUBLIC_API_PATTERN = /^\/api\/(auth\/(check-email|create-profile|webhooks)|public|health|monitoring)/
const PROTECTED_PATTERN = /^\/(client|home|my-page|events|saved-cards|my-namecard|my-qr|notifications|onboarding)/
const AUTH_PATTERN = /^\/(login|signup|verify|forgot-password|reset-password)/
const ADMIN_PATTERN = /^\/admin/
const ADMIN_AUTH_PATTERN = /^\/admin\/(login|signup)$/
const PUBLIC_BUSINESS_CARD_PATTERN = /^\/business-card\/[^\/]+$/
const SCAN_PATTERN = /^\/(client\/scan-card|client\/events\/scan)$/
const PUBLIC_CARD_BOOK_PATTERN = /^\/client\/card-books\//

export async function middleware(req: NextRequest) {
  // 0. 도메인 리다이렉트 (non-www -> www)
  const host = req.headers.get('host') || '';
  if (process.env.NODE_ENV === 'production' && host === 'ndrop.kr') {
    const url = new URL(req.url);
    url.host = 'www.ndrop.kr';
    return NextResponse.redirect(url, { status: 301 });
  }

  const { supabase, supabaseResponse } = createClient(req)
  const redis = getRedisClient()
  
  const pathname = req.nextUrl.pathname
  
  // 1. 정적 파일, 공개 API는 즉시 반환
  if (STATIC_EXT_PATTERN.test(pathname) || 
      PUBLIC_API_PATTERN.test(pathname) ||
      pathname.includes('_next/') ||
      pathname.includes('public/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml') {
    return supabaseResponse
  }
  
  // 2. 공개 페이지 확인
  const isPublicPage = PUBLIC_BUSINESS_CARD_PATTERN.test(pathname) || 
                       SCAN_PATTERN.test(pathname) || 
                       PUBLIC_CARD_BOOK_PATTERN.test(pathname)
  
  if (isPublicPage) {
    return supabaseResponse
  }
  
  // 3. 세션 토큰 추출
  const sessionToken = req.cookies.get('sb-access-token')?.value
  let session = null
  let sessionSource = 'none'
  
  // 4. 메모리 캐시 확인 (가장 빠름)
  if (sessionToken) {
    const memoryCached = memoryCache.getSession(sessionToken)
    if (memoryCached) {
      session = memoryCached
      sessionSource = 'memory'
    }
  }
  
  // 5. Redis 캐시 확인
  if (!session && sessionToken) {
    try {
      const cacheKey = `session:${sessionToken.substring(0, 32)}`
      const cachedSession = await redis.get(cacheKey)
      if (cachedSession) {
        session = cachedSession
        memoryCache.setSession(sessionToken, session)
        sessionSource = 'redis'
      }
    } catch (error) {
      console.warn('Redis 세션 조회 오류:', error)
    }
  }
  
  // 6. DB 조회 (캐시 미스 시)
  if (!session) {
    const dbStart = Date.now()
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData.session
      
      if (session && sessionToken) {
        // 캐시 저장
        memoryCache.setSession(sessionToken, session)
        
        try {
          const cacheKey = `session:${sessionToken.substring(0, 32)}`
          await redis.setex(cacheKey, 300, session) // 5분 TTL
        } catch (redisError) {
          console.warn('Redis 세션 저장 오류:', redisError)
        }
        
        sessionSource = 'database'
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ DB 세션 조회: ${Date.now() - dbStart}ms (${sessionSource})`)
        }
      }
    } catch (error) {
      console.error('세션 조회 오류:', error)
    }
  }
  
  // 7. 사용자 역할 조회
  let userRole: number | null = null
  let roleSource = 'none'
  
  if (session?.user?.id) {
    const userId = session.user.id
    
    // 메모리 캐시 확인
    const memoryCachedRole = memoryCache.getRole(userId)
    if (memoryCachedRole !== null && memoryCachedRole !== undefined) {
      userRole = memoryCachedRole
      roleSource = 'memory'
    }
    
    // Redis 캐시 확인
    if (userRole === null) {
      try {
        const cacheKey = `role:${userId}`
        const cachedRole = await redis.get(cacheKey)
        if (cachedRole !== null) {
          userRole = Number(cachedRole)
          memoryCache.setRole(userId, userRole)
          roleSource = 'redis'
        }
      } catch (error) {
        console.warn('Redis 역할 조회 오류:', error)
      }
    }
    
    // DB 조회
    if (userRole === null) {
      const dbStart = Date.now()
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', userId)
          .single()
        
        if (!error && profile) {
          userRole = profile.role_id
          roleSource = 'database'
          
          // 캐시 저장
          memoryCache.setRole(userId, userRole)
          
          try {
            const cacheKey = `role:${userId}`
            await redis.setex(cacheKey, 600, userRole) // 10분 TTL
          } catch (redisError) {
            console.warn('Redis 역할 저장 오류:', redisError)
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ DB 역할 조회: ${Date.now() - dbStart}ms (${roleSource})`)
          }
        }
      } catch (error) {
        console.error('역할 조회 오류:', error)
      }
    }
  }
  
  // 개발 환경에서 캐시 히트율 로깅
  if (process.env.NODE_ENV === 'development' && sessionToken) {
    console.log(`🎯 세션: ${sessionSource}, 역할: ${roleSource}`)
  }
  
  // 8. 경로 매칭
  const isProtectedRoute = PROTECTED_PATTERN.test(pathname) && !isPublicPage
  const isAuthRoute = AUTH_PATTERN.test(pathname)
  const isAdminRoute = ADMIN_PATTERN.test(pathname)
  const isAdminAuthRoute = ADMIN_AUTH_PATTERN.test(pathname)
  
  // 9. 나머지 로직
  const returnTo = req.nextUrl.pathname
  
  // 루트 경로 처리
  if (pathname === '/') {
    // 세션이 없으면 랜딩 페이지(app/page.tsx)를 보여줌
    if (!session) {
      return supabaseResponse
    }
    
    // 세션이 있으면 역할에 따라 대시보드로 리다이렉트
    if (userRole === 2) {
      return NextResponse.redirect(new URL('/admin', req.url))
    } else {
      return NextResponse.redirect(new URL('/client/home', req.url))
    }
  }
  
  // Admin 경로 접근 제어
  if (isAdminRoute && !isAdminAuthRoute) {
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
  
  // 로그인된 관리자가 Admin 인증 페이지 접근 시
  if (isAdminAuthRoute) {
    const adminToken = req.cookies.get('admin_token')?.value
    const adminUser = req.cookies.get('admin_user')?.value
    
    if (adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser)
        if (userData.role_id === 2) {
          const returnToUrl = req.nextUrl.searchParams.get('returnTo')
          return NextResponse.redirect(new URL(returnToUrl || '/admin', req.url))
        }
      } catch (error) {
        // 무시
      }
    }
  }
  
  // 보호된 경로 접근 제어
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(redirectUrl)
  }
  
  // 로그인된 사용자가 인증 페이지 접근 시
  if (isAuthRoute && session) {
    const returnToUrl = req.nextUrl.searchParams.get('returnTo')
    
    if (userRole === 2) {
      return NextResponse.redirect(new URL(returnToUrl || '/admin', req.url))
    } else {
      return NextResponse.redirect(new URL(returnToUrl || '/client/home', req.url))
    }
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api-docs|\\.well-known).*)',
  ],
}
