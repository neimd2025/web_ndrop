// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  role?: string
  company?: string
  profile_image_url?: string
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'admin'
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
}

// 프로필 재시도 큐 (서버 사이드에서는 요청별로 분리)
const profileRetryCache = new Map<string, Promise<any>>();

// 프로필 조회 재시도 로직
async function getUserProfileWithRetry(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxRetries = 3,
  initialDelay = 500
) {
  const cacheKey = `profile-${userId}`;
  
  // 이미 진행 중인 요청이 있으면 기다림
  if (profileRetryCache.has(cacheKey)) {
    return await profileRetryCache.get(cacheKey);
  }

  const retryPromise = (async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // .single() 대신 .maybeSingle()

        // 프로필이 있으면 반환
        if (profile && !error) {
          return profile;
        }

        // 프로필이 없으면 생성 시도 (첫 번째 시도에서만)
        if (attempt === 1 && (!profile || error?.code === 'PGRST116')) {
          console.log(`서버: 사용자 프로필 없음, 생성 시도 (${userId})`);
          
          // 기본 프로필 생성
          const { data: userData } = await supabase.auth.getUser();
          const userEmail = userData.user?.email || '';
          
          const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: userId,
              email: userEmail,
              role_id: 1, // 기본 사용자
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (insertError && insertError.code !== '23505') {
            console.error('서버: 프로필 생성 오류:', insertError);
          } else {
            console.log('서버: 프로필 생성 완료');
          }

          // 생성 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 300));
          continue; // 생성 후 다시 조회
        }

        // 재시도
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(1.5, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`서버: 프로필 조회 시도 ${attempt} 실패:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, initialDelay * attempt));
        }
      }
    }
    
    return null;
  })();

  profileRetryCache.set(cacheKey, retryPromise);
  
  try {
    return await retryPromise;
  } finally {
    profileRetryCache.delete(cacheKey);
  }
}

// 세션 복구 로직
async function recoverServerSession(supabase: ReturnType<typeof createClient>) {
  try {
    // 1. getUser() 먼저 시도
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('서버: getUser 실패, getSession 시도:', userError.message);
      // getUser 실패 시 getSession으로 폴백
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    }
    
    if (!user) return null;
    
    // 2. 세션 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('서버: 세션 복구 오류:', error);
    return null;
  }
}

// 서버 사이드 사용자 인증 확인 (수정된 버전)
export async function getServerAuth(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()

    // 세션 복구 시도
    const session = await recoverServerSession(supabase)
    
    if (!session?.user) {
      return null
    }

    const user = session.user;

    // 🔥 지연 조회 및 재시도 로직 적용
    const profile = await getUserProfileWithRetry(supabase, user.id)

    if (!profile) {
      // 프로필이 없어도 기본 정보는 반환
      return {
        id: user.id,
        email: user.email!,
        created_at: user.created_at
      }
    }

    return {
      id: user.id,
      email: user.email!,
      full_name: profile.full_name,
      role: profile.role || 'user',
      company: profile.company,
      profile_image_url: profile.profile_image_url,
      created_at: user.created_at
    }
  } catch (error) {
    console.error('서버 인증 확인 오류:', error)
    return null
  }
}

// 서버 사이드 관리자 인증 확인 (수정된 버전)
export async function getAdminAuth(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()

    // 세션 복구 시도
    const session = await recoverServerSession(supabase)
    
    if (!session?.user) {
      return null
    }

    const user = session.user;

    // 🔥 지연 조회 및 재시도 로직 적용
    const profile = await getUserProfileWithRetry(supabase, user.id)

    if (!profile || profile.role_id !== 2) { // admin role_id 체크
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      full_name: profile.full_name,
      role: 'admin',
      role_id: profile.role_id,
      company: profile.company,
      contact: profile.contact,
      profile_image_url: profile.profile_image_url
    } as AdminUser
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

// 사용자 인증 필수 (리다이렉트) - 재시도 로직 추가
export async function requireServerUserAuth(): Promise<AuthUser> {
  try {
    let user = await getServerAuth()
    
    // 첫 번째 시도 실패 시 1초 후 재시도
    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      user = await getServerAuth()
    }

    if (!user) {
      redirect('/login?type=user')
    }

    return user
  } catch (error) {
    console.error('requireServerUserAuth 오류:', error)
    redirect('/login?type=user')
  }
}

// 관리자 인증 필수 (리다이렉트) - 재시도 로직 추가
export async function requireAdminAuth(): Promise<AdminUser> {
  try {
    let adminUser = await getAdminAuth()
    
    // 첫 번째 시도 실패 시 1초 후 재시도
    if (!adminUser) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      adminUser = await getAdminAuth()
    }

    if (!adminUser) {
      redirect('/login?type=admin&returnTo=/admin')
    }

    return adminUser
  } catch (error) {
    console.error('requireAdminAuth 오류:', error)
    redirect('/login?type=admin&returnTo=/admin')
  }
}

// 인증 상태에 따른 조건부 리다이렉트
export async function redirectIfAuthenticated(userType: 'user' | 'admin' = 'user') {
  try {
    if (userType === 'admin') {
      const admin = await getAdminAuth()
      if (admin) {
        redirect('/admin')
      }
    } else {
      const user = await getServerAuth()
      if (user) {
        redirect('/client/home')
      }
    }
  } catch (error) {
    console.error('redirectIfAuthenticated 오류:', error)
    // 오류 발생 시 리다이렉트 하지 않음
  }
}

// 로그인 페이지용 인증 확인 (이미 로그인된 경우 리다이렉트)
export async function handleLoginPageAuth(searchParams: { type?: string, returnTo?: string }) {
  try {
    const userType = searchParams.type === 'admin' ? 'admin' : 'user'

    if (userType === 'admin') {
      const admin = await getAdminAuth()
      if (admin) {
        const returnTo = searchParams.returnTo || '/admin'
        redirect(returnTo)
      }
    } else {
      const user = await getServerAuth()
      if (user) {
        const returnTo = searchParams.returnTo || '/client/home'
        redirect(returnTo)
      }
    }
  } catch (error) {
    console.error('handleLoginPageAuth 오류:', error)
    // 오류 발생 시 리다이렉트 하지 않음
  }
}

export async function checkAdminAuth(): Promise<{ isAuthenticated: boolean; user: AdminUser | null }> {
  try {
    const adminUser = await getAdminAuth()
    return {
      isAuthenticated: !!adminUser,
      user: adminUser
    }
  } catch (error) {
    console.error('checkAdminAuth 오류:', error)
    return {
      isAuthenticated: false,
      user: null
    }
  }
}

// 세션 새로고침 함수 (서버 사이드)
export async function refreshServerSession() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.refreshSession()
    return session
  } catch (error) {
    console.error('서버 세션 갱신 오류:', error)
    return null
  }
}
