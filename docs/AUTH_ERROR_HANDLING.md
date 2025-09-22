# 🚨 인증 에러 처리 가이드

## 📋 목차
1. [에러 타입 분류](#에러-타입-분류)
2. [토큰 만료 에러 처리](#토큰-만료-에러-처리)
3. [OAuth 에러 처리](#oauth-에러-처리)
4. [권한 에러 처리](#권한-에러-처리)
5. [사용자 친화적 에러 메시지](#사용자-친화적-에러-메시지)
6. [디버깅 및 모니터링](#디버깅-및-모니터링)

---

## 🔍 에러 타입 분류

### 1. 인증 에러 (Authentication Errors)

#### 토큰 관련 에러
```typescript
// 토큰 만료
"Invalid Refresh Token: Refresh Token Not Found"
"JWT expired"
"Token has expired"

// 토큰 형식 오류
"Invalid JWT"
"Malformed JWT"
"Invalid token format"
```

#### 로그인 에러
```typescript
// 자격 증명 오류
"Invalid login credentials"
"Invalid email or password"
"User not found"

// 계정 상태 오류
"Email not confirmed"
"Account disabled"
"Too many requests"
```

### 2. 권한 에러 (Authorization Errors)

#### 역할 기반 에러
```typescript
// 관리자 권한 부족
"Admin access required"
"User role insufficient"

// 리소스 접근 권한 부족
"Access denied to resource"
"Permission denied"
```

### 3. 네트워크 에러 (Network Errors)

#### 연결 오류
```typescript
// 네트워크 연결 실패
"Network request failed"
"Connection timeout"
"Server unavailable"

// API 응답 오류
"Internal server error"
"Service temporarily unavailable"
```

---

## 🔄 토큰 만료 에러 처리

### 1. 에러 감지 시스템

#### Supabase 클라이언트 레벨 감지
```typescript
// utils/supabase/client.ts
export const createClient = () => {
  const client = createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );

  // 인증 에러 감지 및 처리
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('⚠️ 토큰 갱신 실패 - 리프레시 토큰이 유효하지 않습니다')
      
      // 전역 에러 이벤트 발생
      if (typeof window !== 'undefined') {
        const error = new Error('Invalid Refresh Token: Refresh Token Not Found')
        const authErrorEvent = new CustomEvent('auth-error', { detail: error })
        window.dispatchEvent(authErrorEvent)
      }
    }
  });

  return client;
};
```

#### 인증 스토어 레벨 감지
```typescript
// stores/auth-store.ts
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    // 토큰 만료 또는 인증 에러 처리
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('⚠️ 토큰 갱신 실패 - 세션이 만료되었습니다')
      // 세션 만료 시 모든 인증 상태 초기화
      if (type === 'user' || !type) {
        set({
          user: null,
          userSession: null,
          userProfile: null,
        })
      }
      if (type === 'admin' || !type) {
        set({
          admin: null,
          adminSession: null,
          adminProfile: null,
        })
      }
      return
    }

    // SIGNED_OUT 이벤트 처리 (토큰 만료 포함)
    if (event === 'SIGNED_OUT') {
      console.log('🔄 사용자가 로그아웃되었거나 세션이 만료되었습니다')
      // 인증 상태 초기화 로직
    }
  }
)
```

### 2. 전역 에러 핸들러

#### AuthErrorHandler 컴포넌트
```typescript
// components/auth-error-handler.tsx
export default function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const { handleTokenExpired } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // 전역 에러 핸들러 등록
    const handleAuthError = (event: CustomEvent) => {
      const error = event.detail
      
      if (error?.message?.includes('Invalid Refresh Token') || 
          error?.message?.includes('Refresh Token Not Found')) {
        
        console.warn('🔄 리프레시 토큰 에러 감지:', error.message)
        
        // 사용자에게 친화적인 메시지 표시
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
          duration: 5000,
          action: {
            label: '로그인',
            onClick: () => {
              handleTokenExpired()
            }
          }
        })
        
        // 3초 후 자동으로 로그인 페이지로 이동
        setTimeout(() => {
          handleTokenExpired()
        }, 3000)
      }
    }

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('auth-error', handleAuthError as EventListener)

    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener)
    }
  }, [handleTokenExpired])

  return <>{children}</>
}
```

#### 토큰 만료 처리 함수
```typescript
// stores/auth-store.ts
handleTokenExpired: () => {
  console.warn('🔄 토큰이 만료되었습니다. 로그인 페이지로 이동합니다.')
  
  // 모든 인증 상태 초기화
  set({
    user: null,
    userSession: null,
    userProfile: null,
    admin: null,
    adminSession: null,
    adminProfile: null,
  })

  // 로그인 페이지로 리다이렉트
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
```

### 3. 에러 이벤트 발생 유틸리티

```typescript
// components/auth-error-handler.tsx
// 에러를 전역으로 발생시키는 유틸리티 함수
export const triggerAuthError = (error: any) => {
  const event = new CustomEvent('auth-error', { detail: error })
  window.dispatchEvent(event)
}
```

---

## 🔐 OAuth 에러 처리

### 1. OAuth 콜백 에러 처리

#### 클라이언트 사이드 에러 처리
```typescript
// app/auth/callback/page.tsx
useEffect(() => {
  const handleAuthCallback = async () => {
    console.log('🔄 OAuth 콜백 처리 시작')
    
    try {
      const supabase = createClient()
      
      // 세션 확인
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ OAuth 콜백 실패:', error)
        setError(error.message)
        toast.error('로그인 처리 중 오류가 발생했습니다.')
        
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        return
      }

      // 성공적인 인증 처리
      if (data.session && data.session.user) {
        console.log('✅ OAuth 로그인 성공:', data.session.user.email)
        // 프로필 확인 및 생성 로직
      }
    } catch (error) {
      console.error('❌ OAuth 콜백 처리 중 예외 발생:', error)
      setError('예상치 못한 오류가 발생했습니다.')
      toast.error('로그인 처리 중 오류가 발생했습니다.')
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }

  handleAuthCallback()
}, [])
```

#### 서버 사이드 에러 처리
```typescript
// app/(auth)/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ OAuth 코드 교환 실패:', error)
        return NextResponse.redirect(
          new URL(`/error?message=${encodeURIComponent('OAuth 로그인 중 오류가 발생했습니다.')}`, origin)
        )
      }

      if (!data.user) {
        console.error('❌ OAuth 사용자 정보 없음')
        return NextResponse.redirect(
          new URL(`/error?message=${encodeURIComponent('사용자 정보를 가져올 수 없습니다.')}`, origin)
        )
      }

      // 프로필 생성 로직
      try {
        const existingProfile = await userProfileAPI.getUserProfile(data.user.id)
        
        if (!existingProfile) {
          // 신규 사용자 프로필 생성
          await userProfileAPI.createUserProfile({...})
          await businessCardAPI.createBusinessCard({...})
        }
      } catch (profileError) {
        console.error('⚠️ OAuth 프로필 생성 중 오류:', profileError)
        // 프로필 생성 실패해도 로그인은 성공으로 처리
      }

      return NextResponse.redirect(new URL(next, origin))
    } catch (error) {
      console.error('❌ OAuth 콜백 처리 중 예외:', error)
      return NextResponse.redirect(
        new URL(`/error?message=${encodeURIComponent('OAuth 로그인 중 오류가 발생했습니다.')}`, origin)
      )
    }
  }

  // 코드가 없는 경우
  return NextResponse.redirect(
    new URL(`/error?message=${encodeURIComponent('OAuth 인증 코드가 없습니다.')}`, origin)
  )
}
```

### 2. OAuth 제공자별 에러 처리

#### Google OAuth 에러
```typescript
// Google OAuth 특정 에러 처리
const handleGoogleOAuthError = (error: any) => {
  switch (error.code) {
    case 'access_denied':
      toast.error('Google 로그인이 취소되었습니다.')
      break
    case 'popup_closed_by_user':
      toast.error('로그인 창이 닫혔습니다. 다시 시도해주세요.')
      break
    case 'network_error':
      toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      break
    default:
      toast.error('Google 로그인 중 오류가 발생했습니다.')
  }
}
```

#### Kakao OAuth 에러
```typescript
// Kakao OAuth 특정 에러 처리
const handleKakaoOAuthError = (error: any) => {
  switch (error.code) {
    case 'access_denied':
      toast.error('카카오 로그인이 취소되었습니다.')
      break
    case 'invalid_request':
      toast.error('잘못된 요청입니다. 다시 시도해주세요.')
      break
    default:
      toast.error('카카오 로그인 중 오류가 발생했습니다.')
  }
}
```

---

## 🛡️ 권한 에러 처리

### 1. 미들웨어 권한 에러

#### 관리자 권한 부족
```typescript
// middleware.ts
// Admin 경로 접근 제어
if (isAdminRoute && !isAdminAuthRoute) {
  if (!session || userRole !== 2) {
    const redirectUrl = new URL('/admin/login', req.url)
    redirectUrl.searchParams.set('returnTo', returnTo)
    
    // 권한 부족 에러 로깅
    console.warn(`❌ 관리자 권한 부족: ${req.nextUrl.pathname}`, {
      userId: session?.user?.id,
      userRole,
      requiredRole: 2
    })
    
    return NextResponse.redirect(redirectUrl)
  }
}
```

#### 사용자 권한 확인
```typescript
// 사용자 역할 확인 함수
async function getUserRole(userId: string): Promise<number | null> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', userId)
      .single()

    return profile?.role_id || null
  } catch (error) {
    console.error('getUserRole error:', error)
    return null
  }
}
```

### 2. API 레벨 권한 에러

#### 인증 확인
```typescript
// API 엔드포인트에서 인증 확인
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.warn('❌ API 인증 실패:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 프로필 및 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.warn('❌ 사용자 프로필 없음:', profileError)
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (예: 관리자만 접근 가능)
    if (profile.role_id !== 2) {
      console.warn('❌ 관리자 권한 부족:', {
        userId: user.id,
        userRole: profile.role_id,
        requiredRole: 2
      })
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 정상 처리 로직
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API 처리 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

---

## 💬 사용자 친화적 에러 메시지

### 1. 에러 메시지 매핑

#### 로그인 에러 메시지
```typescript
// stores/auth-store.ts
const getLoginErrorMessage = (error: any): string => {
  switch (error.message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    
    case 'Email not confirmed':
      return '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
    
    case 'User not found':
      return '가입되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
    
    case 'Too many requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
    
    default:
      if (error.message.includes('email')) {
        return '올바른 이메일 형식을 입력해주세요.'
      } else if (error.message.includes('password')) {
        return '비밀번호를 확인해주세요.'
      }
      return '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
  }
}
```

#### 회원가입 에러 메시지
```typescript
const getSignupErrorMessage = (error: any): string => {
  switch (error.message) {
    case 'User already registered':
      return '이미 가입된 이메일입니다. 로그인을 시도해주세요.'
    
    case 'Password should be at least 6 characters':
      return '비밀번호는 최소 6자 이상이어야 합니다.'
    
    case 'Invalid email':
      return '올바른 이메일 형식을 입력해주세요.'
    
    case 'Signup is disabled':
      return '현재 회원가입이 비활성화되어 있습니다.'
    
    default:
      return '회원가입에 실패했습니다. 입력 정보를 확인해주세요.'
  }
}
```

### 2. 토스트 메시지 시스템

#### 에러 토스트 설정
```typescript
// 에러 토스트 표시
const showErrorToast = (message: string, action?: { label: string; onClick: () => void }) => {
  toast.error(message, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined
  })
}

// 성공 토스트 표시
const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000
  })
}

// 경고 토스트 표시
const showWarningToast = (message: string) => {
  toast.warning(message, {
    duration: 4000
  })
}
```

#### 상황별 토스트 메시지
```typescript
// 토큰 만료 시
toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
  duration: 5000,
  action: {
    label: '로그인',
    onClick: () => handleTokenExpired()
  }
})

// 권한 부족 시
toast.warning('관리자 권한이 없습니다. 사용자 홈으로 이동합니다.')

// OAuth 로그인 성공 시
toast.success('로그인되었습니다!')

// 프로필 생성 완료 시
toast.success('프로필이 생성되었습니다!')
```

---

## 🔍 디버깅 및 모니터링

### 1. 에러 로깅 시스템

#### 구조화된 로깅
```typescript
// 에러 로깅 유틸리티
const logAuthError = (error: any, context: string, additionalInfo?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      code: error.code,
      status: error.status
    },
    additionalInfo,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }

  console.error('🚨 인증 에러:', errorLog)
  
  // 프로덕션에서는 외부 로깅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket 등으로 전송
    // logToExternalService(errorLog)
  }
}
```

#### 에러 컨텍스트별 로깅
```typescript
// 로그인 에러 로깅
const handleLoginError = (error: any, email: string) => {
  logAuthError(error, 'LOGIN_ATTEMPT', {
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 이메일 마스킹
    timestamp: new Date().toISOString()
  })
}

// OAuth 에러 로깅
const handleOAuthError = (error: any, provider: string) => {
  logAuthError(error, 'OAUTH_LOGIN', {
    provider,
    timestamp: new Date().toISOString()
  })
}

// 토큰 만료 에러 로깅
const handleTokenExpiredError = (error: any) => {
  logAuthError(error, 'TOKEN_EXPIRED', {
    timestamp: new Date().toISOString(),
    sessionExpired: true
  })
}
```

### 2. 성능 모니터링

#### 인증 성능 메트릭
```typescript
// 인증 시간 측정
const measureAuthPerformance = async (authFunction: () => Promise<any>, operation: string) => {
  const startTime = performance.now()
  
  try {
    const result = await authFunction()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`✅ ${operation} 성공: ${duration.toFixed(2)}ms`)
    
    // 성능 임계값 확인
    if (duration > 5000) {
      console.warn(`⚠️ ${operation} 지연: ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.error(`❌ ${operation} 실패: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

// 사용 예시
const loginWithEmail = async (email: string, password: string) => {
  return measureAuthPerformance(
    () => supabase.auth.signInWithPassword({ email, password }),
    '이메일 로그인'
  )
}
```

### 3. 에러 복구 전략

#### 자동 재시도 로직
```typescript
// 네트워크 에러 시 자동 재시도
const retryAuthOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // 네트워크 에러인 경우에만 재시도
      if (error.message.includes('network') || error.message.includes('timeout')) {
        console.warn(`🔄 인증 작업 재시도 ${attempt}/${maxRetries}:`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      } else {
        throw error
      }
    }
  }
}
```

#### 세션 복구 로직
```typescript
// 세션 복구 시도
const attemptSessionRecovery = async () => {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ 세션 복구 실패:', error)
      return false
    }
    
    if (session) {
      console.log('✅ 세션 복구 성공')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ 세션 복구 중 오류:', error)
    return false
  }
}
```

---

## 📊 에러 통계 및 분석

### 1. 에러 발생 빈도 추적

```typescript
// 에러 통계 수집
const errorStats = {
  tokenExpired: 0,
  loginFailed: 0,
  oauthFailed: 0,
  permissionDenied: 0,
  networkError: 0
}

const trackError = (errorType: keyof typeof errorStats) => {
  errorStats[errorType]++
  
  // 로컬 스토리지에 저장
  localStorage.setItem('authErrorStats', JSON.stringify(errorStats))
  
  // 주기적으로 서버로 전송
  if (errorStats[errorType] % 10 === 0) {
    sendErrorStatsToServer(errorStats)
  }
}
```

### 2. 사용자 행동 분석

```typescript
// 사용자 행동 추적
const trackUserBehavior = (action: string, context?: any) => {
  const behavior = {
    action,
    context,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    sessionId: getCurrentSessionId()
  }
  
  console.log('📊 사용자 행동:', behavior)
  
  // 분석 서비스로 전송
  // analytics.track(action, context)
}
```

---

## 🔧 에러 처리 설정

### 1. 환경별 에러 처리

```typescript
// 환경별 에러 처리 설정
const getErrorHandlingConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    showDetailedErrors: isDevelopment,
    logToConsole: isDevelopment,
    sendToExternalService: isProduction,
    autoRetry: true,
    maxRetries: isDevelopment ? 1 : 3,
    retryDelay: isDevelopment ? 500 : 1000
  }
}
```

### 2. 에러 처리 미들웨어

```typescript
// API 에러 처리 미들웨어
export const withErrorHandling = (handler: Function) => {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('❌ API 에러:', error)
      
      // 에러 타입별 처리
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: '인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
      
      if (error instanceof PermissionError) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        )
      }
      
      // 일반 서버 에러
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}
```

---

## 📚 추가 리소스

### 관련 문서
- [인증 시스템 전체 가이드](./AUTH_SYSTEM_OVERVIEW.md)
- [SNS 로그인 설정 가이드](./SNS_LOGIN_SETUP.md)
- [배포 가이드](./DEPLOYMENT.md)

### 외부 링크
- [Supabase Auth 에러 처리](https://supabase.com/docs/guides/auth/errors)
- [Next.js 에러 처리](https://nextjs.org/docs/advanced-features/error-handling)
- [React 에러 바운더리](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

*이 문서는 Neimd 인증 시스템의 에러 처리 방식을 상세히 설명합니다. 에러가 발생했을 때 적절한 대응을 할 수 있도록 도와줍니다.*
