# 🔧 인증 시스템 문제 해결 가이드

## 📋 목차
1. [일반적인 문제](#일반적인-문제)
2. [토큰 관련 문제](#토큰-관련-문제)
3. [OAuth 관련 문제](#oauth-관련-문제)
4. [권한 관련 문제](#권한-관련-문제)
5. [데이터베이스 관련 문제](#데이터베이스-관련-문제)
6. [네트워크 관련 문제](#네트워크-관련-문제)
7. [디버깅 도구](#디버깅-도구)
8. [성능 문제](#성능-문제)

---

## 🚨 일반적인 문제

### 1. 로그인이 안 되는 경우

#### 증상
- 이메일/비밀번호를 올바르게 입력했는데 로그인이 실패
- "Invalid login credentials" 에러 메시지 표시

#### 원인 및 해결방법

**원인 1: 이메일 인증 미완료**
```typescript
// 확인 방법
const { data: { user } } = await supabase.auth.getUser()
console.log('이메일 인증 상태:', user?.email_confirmed_at)
```

**해결방법:**
1. 이메일함에서 인증 메일 확인
2. 인증 링크 클릭
3. 인증 완료 후 다시 로그인 시도

**원인 2: 잘못된 비밀번호**
```typescript
// 비밀번호 재설정
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

**원인 3: 계정이 비활성화됨**
```sql
-- 데이터베이스에서 계정 상태 확인
SELECT email, email_confirmed_at, banned_until 
FROM auth.users 
WHERE email = 'user@example.com';
```

### 2. 회원가입이 안 되는 경우

#### 증상
- 회원가입 폼 제출 시 에러 발생
- "User already registered" 메시지 표시

#### 원인 및 해결방법

**원인 1: 이미 가입된 이메일**
```typescript
// 이메일 중복 확인
const { data, error } = await supabase
  .from('user_profiles')
  .select('email')
  .eq('email', email)
  .single()

if (data) {
  console.log('이미 가입된 이메일입니다.')
}
```

**해결방법:**
1. 로그인 페이지로 이동
2. 비밀번호 재설정 시도
3. 필요시 관리자에게 문의

**원인 2: 비밀번호 정책 위반**
```typescript
// 비밀번호 검증
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
if (!passwordRegex.test(password)) {
  return { error: '비밀번호는 최소 8자 이상, 대소문자, 숫자를 포함해야 합니다.' }
}
```

### 3. 세션이 유지되지 않는 경우

#### 증상
- 로그인 후 페이지 새로고침 시 로그아웃됨
- 브라우저 탭 간 세션 공유 안됨

#### 원인 및 해결방법

**원인 1: 로컬 스토리지 문제**
```typescript
// 로컬 스토리지 확인
console.log('Local Storage:', localStorage.getItem('auth-storage'))
console.log('Session Storage:', sessionStorage.getItem('supabase.auth.token'))
```

**해결방법:**
1. 브라우저 개발자 도구에서 로컬 스토리지 확인
2. 쿠키 설정 확인
3. 시크릿 모드에서 테스트

**원인 2: Zustand Persist 설정 문제**
```typescript
// auth-store.ts에서 persist 설정 확인
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... 스토어 로직
    }),
    {
      name: 'auth-storage', // 스토리지 키
      partialize: (state) => ({
        user: state.user,
        userSession: state.userSession,
        userProfile: state.userProfile,
        // 필요한 상태만 저장
      }),
    }
  )
)
```

---

## 🔑 토큰 관련 문제

### 1. "Invalid Refresh Token" 에러

#### 증상
- 갑자기 로그아웃됨
- "세션이 만료되었습니다" 메시지 표시

#### 원인 및 해결방법

**원인 1: 리프레시 토큰 만료**
```typescript
// 토큰 만료 시간 확인
const session = await supabase.auth.getSession()
const expiresAt = session.data.session?.expires_at
const now = Math.floor(Date.now() / 1000)

if (expiresAt && now > expiresAt) {
  console.log('토큰이 만료되었습니다.')
}
```

**해결방법:**
1. 자동으로 로그인 페이지로 리다이렉트됨
2. 다시 로그인 진행
3. 필요시 "자동 로그인" 기능 사용

**원인 2: 동시 로그인으로 인한 토큰 무효화**
```typescript
// 다중 세션 감지
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !session) {
    console.log('다른 기기에서 로그인하여 세션이 무효화되었습니다.')
  }
})
```

### 2. 토큰 갱신 실패

#### 증상
- API 요청 시 401 에러 반복
- 토큰 갱신 시도 후에도 실패

#### 원인 및 해결방법

**원인 1: 네트워크 연결 문제**
```typescript
// 네트워크 상태 확인
const checkNetworkStatus = async () => {
  try {
    const response = await fetch('https://api.supabase.co/health')
    return response.ok
  } catch (error) {
    console.error('네트워크 연결 실패:', error)
    return false
  }
}
```

**해결방법:**
1. 인터넷 연결 확인
2. VPN 사용 시 비활성화
3. 방화벽 설정 확인

**원인 2: Supabase 서비스 장애**
```typescript
// Supabase 상태 확인
const checkSupabaseStatus = async () => {
  try {
    const response = await fetch('https://status.supabase.com/api/v2/status.json')
    const data = await response.json()
    return data.status.indicator === 'none'
  } catch (error) {
    return false
  }
}
```

### 3. JWT 토큰 형식 오류

#### 증상
- "Invalid JWT" 에러
- "Malformed JWT" 에러

#### 원인 및 해결방법

**원인 1: 토큰 손상**
```typescript
// 토큰 형식 검증
const validateJWT = (token: string) => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    console.error('JWT 형식이 올바르지 않습니다.')
    return false
  }
  return true
}
```

**해결방법:**
1. 로컬 스토리지 초기화
2. 브라우저 캐시 삭제
3. 다시 로그인

---

## 🔐 OAuth 관련 문제

### 1. Google 로그인 실패

#### 증상
- Google 로그인 버튼 클릭 시 팝업이 닫힘
- "access_denied" 에러

#### 원인 및 해결방법

**원인 1: OAuth 설정 문제**
```typescript
// Supabase 프로젝트 설정 확인
const oauthConfig = {
  redirectURL: `${window.location.origin}/auth/callback`,
  scopes: ['email', 'profile']
}
```

**해결방법:**
1. Supabase 대시보드에서 OAuth 설정 확인
2. Google Cloud Console에서 리다이렉트 URI 확인
3. 클라이언트 ID/시크릿 확인

**원인 2: 팝업 차단**
```typescript
// 팝업 차단 감지
const handleOAuthLogin = async (provider: string) => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('OAuth 로그인 실패:', error)
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.')
    }
  }
}
```

### 2. Kakao 로그인 문제

#### 증상
- Kakao 로그인 시 "앱이 등록되지 않음" 에러
- 콜백 처리 실패

#### 원인 및 해결방법

**원인 1: Kakao 앱 설정 문제**
```typescript
// Kakao 개발자 콘솔 설정 확인
const kakaoConfig = {
  clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  redirectUri: `${window.location.origin}/auth/callback`
}
```

**해결방법:**
1. Kakao 개발자 콘솔에서 앱 설정 확인
2. 플랫폼 설정에서 웹 도메인 추가
3. 동의항목 설정 확인

### 3. OAuth 콜백 처리 실패

#### 증상
- OAuth 인증 후 콜백 페이지에서 멈춤
- "OAuth 로그인 중 오류가 발생했습니다" 메시지

#### 원인 및 해결방법

**원인 1: 콜백 URL 불일치**
```typescript
// 콜백 URL 확인
const callbackUrl = `${window.location.origin}/auth/callback`
console.log('콜백 URL:', callbackUrl)

// Supabase 설정과 일치하는지 확인
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl
  }
})
```

**원인 2: 프로필 생성 실패**
```typescript
// 콜백 핸들러에서 에러 처리
export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('OAuth 콜백 실패:', error)
          setError(error.message)
          return
        }

        // 프로필 생성 시도
        if (data.session && data.session.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.session.user.id,
              email: data.session.user.email,
              // ... 기타 필드
            })

          if (profileError) {
            console.error('프로필 생성 실패:', profileError)
            // 프로필 생성 실패해도 로그인은 성공으로 처리
          }
        }
      } catch (error) {
        console.error('예상치 못한 오류:', error)
      }
    }

    handleAuthCallback()
  }, [])
}
```

---

## 🛡️ 권한 관련 문제

### 1. 관리자 권한 부족

#### 증상
- 관리자 페이지 접근 시 "권한이 없습니다" 메시지
- 관리자 기능 사용 불가

#### 원인 및 해결방법

**원인 1: role_id 설정 오류**
```sql
-- 사용자 역할 확인
SELECT id, email, role_id, role 
FROM user_profiles 
WHERE id = 'user-id';

-- 관리자 권한 부여
UPDATE user_profiles 
SET role_id = 2, role = 'admin' 
WHERE id = 'user-id';
```

**원인 2: 미들웨어 권한 검증 실패**
```typescript
// 미들웨어에서 권한 확인 로직
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

### 2. 사용자 프로필 접근 권한 문제

#### 증상
- 본인 프로필 조회 시 403 에러
- 다른 사용자 프로필 접근 시도

#### 원인 및 해결방법

**원인 1: RLS 정책 문제**
```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 올바른 RLS 정책 생성
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

**원인 2: 인증 컨텍스트 문제**
```typescript
// 서버 사이드에서 인증 확인
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 사용자 프로필 조회
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ profile })
}
```

---

## 🗄️ 데이터베이스 관련 문제

### 1. 프로필 생성 실패

#### 증상
- 회원가입 후 프로필이 생성되지 않음
- "프로필을 찾을 수 없습니다" 에러

#### 원인 및 해결방법

**원인 1: 데이터베이스 트리거 실패**
```sql
-- 트리거 함수 확인
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 트리거 재생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role_id, role)
  VALUES (NEW.id, NEW.email, 1, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**원인 2: 테이블 구조 문제**
```sql
-- 테이블 구조 확인
\d user_profiles

-- 누락된 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

### 2. 비즈니스 카드 생성 실패

#### 증상
- 프로필은 생성되었지만 비즈니스 카드가 없음
- 명함 관련 기능 사용 불가

#### 원인 및 해결방법

**원인 1: 외래 키 제약 조건**
```sql
-- 외래 키 제약 조건 확인
SELECT conname, contype, confrelid::regclass, conkey, confkey
FROM pg_constraint 
WHERE conrelid = 'business_cards'::regclass;

-- 비즈니스 카드 수동 생성
INSERT INTO business_cards (
  user_id, full_name, email, company, role, 
  contact, introduction, is_public
) VALUES (
  'user-id', '사용자명', 'user@example.com', 
  '', '', '', '', true
);
```

### 3. 데이터 동기화 문제

#### 증상
- auth.users와 user_profiles 데이터 불일치
- 중복 사용자 생성

#### 원인 및 해결방법

**원인 1: 트리거 실행 실패**
```sql
-- 트리거 상태 확인
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 트리거 활성화
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

**원인 2: 데이터 복구 필요**
```sql
-- 누락된 프로필 찾기
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- 누락된 프로필 생성
INSERT INTO user_profiles (id, email, role_id, role, created_at)
SELECT id, email, 1, 'user', created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
```

---

## 🌐 네트워크 관련 문제

### 1. API 요청 실패

#### 증상
- API 호출 시 네트워크 에러
- "Network request failed" 메시지

#### 원인 및 해결방법

**원인 1: CORS 설정 문제**
```typescript
// CORS 에러 확인
const checkCORS = async () => {
  try {
    const response = await fetch('/api/test', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    console.log('CORS 설정:', response.headers.get('Access-Control-Allow-Origin'))
  } catch (error) {
    console.error('CORS 에러:', error)
  }
}
```

**원인 2: 네트워크 연결 불안정**
```typescript
// 네트워크 상태 모니터링
const monitorNetworkStatus = () => {
  window.addEventListener('online', () => {
    console.log('네트워크 연결됨')
    // 재연결 시 인증 상태 확인
    supabase.auth.getSession()
  })

  window.addEventListener('offline', () => {
    console.log('네트워크 연결 끊김')
    // 오프라인 상태 처리
  })
}
```

### 2. Supabase 연결 문제

#### 증상
- Supabase API 호출 실패
- "Failed to fetch" 에러

#### 원인 및 해결방법

**원인 1: 환경 변수 설정 오류**
```typescript
// 환경 변수 확인
const checkEnvVars = () => {
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.')
  }
}
```

**원인 2: Supabase 프로젝트 설정**
```typescript
// Supabase 연결 테스트
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase 연결 실패:', error)
    } else {
      console.log('Supabase 연결 성공')
    }
  } catch (error) {
    console.error('Supabase 연결 테스트 실패:', error)
  }
}
```

---

## 🔍 디버깅 도구

### 1. 브라우저 개발자 도구

#### 콘솔 명령어
```javascript
// 인증 상태 확인
console.log('Current user:', await window.supabase.auth.getUser())
console.log('Current session:', await window.supabase.auth.getSession())

// Zustand 스토어 상태 확인
console.log('Auth store:', useAuthStore.getState())

// 로컬 스토리지 확인
console.log('Local storage:', localStorage.getItem('auth-storage'))
console.log('Session storage:', sessionStorage.getItem('supabase.auth.token'))

// 네트워크 요청 확인
// Network 탭에서 Supabase API 호출 확인
```

#### 스토리지 탭 활용
```javascript
// 로컬 스토리지 초기화
localStorage.clear()
sessionStorage.clear()

// 특정 키 삭제
localStorage.removeItem('auth-storage')
localStorage.removeItem('supabase.auth.token')
```

### 2. Supabase 대시보드

#### 인증 로그 확인
1. Supabase 대시보드 → Authentication → Users
2. 사용자 목록에서 특정 사용자 클릭
3. "User Details" 탭에서 로그인 이력 확인

#### 데이터베이스 로그 확인
1. Supabase 대시보드 → Logs → Database
2. 에러 로그 및 쿼리 성능 확인
3. RLS 정책 위반 로그 확인

### 3. 네트워크 모니터링

#### API 요청 추적
```typescript
// API 요청 로깅
const logAPIRequest = (url: string, method: string, data?: any) => {
  console.log(`🚀 API Request: ${method} ${url}`, data)
}

const logAPIResponse = (url: string, response: any, error?: any) => {
  if (error) {
    console.error(`❌ API Error: ${url}`, error)
  } else {
    console.log(`✅ API Success: ${url}`, response)
  }
}
```

#### 성능 모니터링
```typescript
// API 응답 시간 측정
const measureAPIPerformance = async (apiCall: () => Promise<any>, name: string) => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    
    if (duration > 5000) {
      console.warn(`⚠️ ${name} 지연: ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    console.error(`❌ ${name} 실패: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}
```

---

## ⚡ 성능 문제

### 1. 로그인 속도 문제

#### 증상
- 로그인 시 5초 이상 소요
- 페이지 로딩이 느림

#### 원인 및 해결방법

**원인 1: 불필요한 API 호출**
```typescript
// 로그인 시 최적화
const optimizedLogin = async (email: string, password: string) => {
  // 1. 인증만 먼저 처리
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error }

  // 2. 프로필 정보는 필요할 때 로드
  const loadProfile = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    return profile
  }

  return { data, loadProfile }
}
```

**원인 2: 대용량 프로필 데이터**
```typescript
// 필요한 필드만 선택
const { data: profile } = await supabase
  .from('user_profiles')
  .select('id, email, full_name, role_id') // 필요한 필드만
  .eq('id', userId)
  .single()
```

### 2. 토큰 갱신 지연

#### 증상
- 토큰 갱신 시 3초 이상 소요
- API 요청 지연

#### 원인 및 해결방법

**원인 1: 네트워크 지연**
```typescript
// 토큰 갱신 최적화
const optimizeTokenRefresh = () => {
  // 토큰 만료 5분 전에 미리 갱신
  const refreshTokenBeforeExpiry = (session: Session) => {
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now
    
    if (timeUntilExpiry < 300) { // 5분 전
      supabase.auth.refreshSession()
    }
  }
}
```

### 3. 메모리 사용량 문제

#### 증상
- 브라우저 메모리 사용량 증가
- 페이지 성능 저하

#### 원인 및 해결방법

**원인 1: Zustand 스토어 최적화**
```typescript
// 불필요한 상태 제거
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... 스토어 로직
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // 필요한 상태만 저장
        user: state.user,
        userSession: state.userSession,
        userProfile: {
          id: state.userProfile?.id,
          email: state.userProfile?.email,
          role_id: state.userProfile?.role_id,
          // 대용량 데이터는 제외
        }
      }),
    }
  )
)
```

---

## 📞 지원 및 문의

### 1. 자주 묻는 질문 (FAQ)

**Q: 로그인 후 바로 로그아웃되는 이유는?**
A: 토큰 만료 또는 브라우저 설정 문제일 수 있습니다. 브라우저 쿠키 설정을 확인하고, 시크릿 모드에서 테스트해보세요.

**Q: Google 로그인이 작동하지 않는 이유는?**
A: OAuth 설정을 확인하세요. Supabase 대시보드와 Google Cloud Console의 설정이 일치하는지 확인해야 합니다.

**Q: 관리자 권한을 받으려면 어떻게 해야 하나요?**
A: 현재는 데이터베이스에서 직접 role_id를 변경해야 합니다. 향후 관리자 승인 시스템을 추가할 예정입니다.

### 2. 에러 리포트

에러가 발생했을 때 다음 정보를 포함해서 리포트해주세요:

```typescript
const generateErrorReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    error: error.message,
    stack: error.stack,
    authState: useAuthStore.getState(),
    localStorage: localStorage.getItem('auth-storage'),
    networkStatus: navigator.onLine
  }
  
  console.log('에러 리포트:', report)
  return report
}
```

### 3. 개발팀 연락처

- **이메일**: dev@neimd.com
- **슬랙**: #neimd-support
- **GitHub Issues**: [프로젝트 저장소](https://github.com/your-org/neimd/issues)

---

## 📚 추가 리소스

### 관련 문서
- [인증 시스템 전체 가이드](./AUTH_SYSTEM_OVERVIEW.md)
- [에러 처리 가이드](./AUTH_ERROR_HANDLING.md)
- [플로우 다이어그램](./AUTH_FLOW_DIAGRAMS.md)

### 외부 링크
- [Supabase 문제 해결 가이드](https://supabase.com/docs/guides/auth/troubleshooting)
- [Next.js 디버깅 가이드](https://nextjs.org/docs/advanced-features/debugging)
- [React 개발자 도구](https://react.dev/learn/react-developer-tools)

---

*이 문서는 Neimd 인증 시스템에서 발생할 수 있는 문제들을 해결하는 데 도움을 줍니다. 문제가 지속되면 개발팀에 문의해주세요.*
