import { getURL } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 사용자 프로필 타입 정의
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
}

interface UserAuthState {
  // 사용자 상태
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  initialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void

  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ data: any; error: any }>
  signInWithOAuth: (provider: 'google' | 'kakao' | 'naver') => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>

  // Profile methods
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>

  // Initialize auth
  initializeAuth: () => Promise<(() => void) | undefined>

  // Clear auth cache
  clearAuthCache: () => void

  // Password reset methods
  setPasswordResetInProgress: (inProgress: boolean, email?: string) => void
  clearPasswordResetState: () => void
}

export const useUserAuthStore = create<UserAuthState>()(persist((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  signInWithEmail: async (email: string, password: string) => {
    const supabase = createClient()

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        data: null,
        error: { message: '올바른 이메일 형식을 입력해주세요.' }
      }
    }

    // 비밀번호 검증
    if (!password || password.length === 0) {
      return {
        data: null,
        error: { message: '비밀번호를 입력해주세요.' }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Supabase 에러 코드별 구체적인 메시지 처리
    if (error) {
      let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'

      switch (error.message) {
        case 'Invalid login credentials':
        case 'Invalid email or password':
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
          break
        case 'Email not confirmed':
          errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
          break
        case 'User not found':
          errorMessage = '가입되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
          break
        case 'Too many requests':
          errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
          break
        default:
          if (error.message.includes('email')) {
            errorMessage = '올바른 이메일 형식을 입력해주세요.'
          } else if (error.message.includes('password')) {
            errorMessage = '비밀번호를 확인해주세요.'
          }
      }

      return { data, error: { ...error, message: errorMessage } }
    }

    // 로그인 성공 시 사용자 프로필 정보 가져오기
    if (data?.user) {
      const profile = await get().fetchUserProfile(data.user.id)
      if (profile) {
        set({ userProfile: profile })
      }
    }

    return { data, error }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    const supabase = createClient()

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        data: null,
        error: { message: '올바른 이메일 형식을 입력해주세요.' }
      }
    }

    // 비밀번호 검증
    if (!password || password.length < 6) {
      return {
        data: null,
        error: { message: '비밀번호는 최소 6자 이상이어야 합니다.' }
      }
    }

    // 이메일 중복 확인 - 일반 사용자(role_id=1)로 이미 가입된 경우 체크
    try {
      const { data: existingUsers } = await supabase
        .from('user_profiles')
        .select('id, email, role_id')
        .eq('email', email)
        .eq('role_id', 1) // 일반 사용자만 체크

      if (existingUsers && existingUsers.length > 0) {
        return {
          data: null,
          error: {
            message: '이미 가입된 이메일입니다. 로그인을 시도해주세요.',
            code: 'USER_ALREADY_EXISTS'
          }
        }
      }
    } catch (error) {
      // 사용자가 없거나 다른 에러인 경우 계속 진행
      console.log('사용자 체크 중 에러 (정상적일 수 있음):', error)
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          name: name || '',
          role_id: 1 // 일반 사용자
        }
      }
    })

    console.log('📧 회원가입 결과:', {
      success: !error,
      user: data?.user?.email,
      error: error?.message
    })

    if (error) {
      let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.'

      switch (error.message) {
        case 'User already registered':
        case 'A user with this email address has already been registered':
          errorMessage = '이미 가입된 이메일입니다. 로그인을 시도해주세요.'
          break
        case 'Password should be at least 6 characters':
          errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.'
          break
        case 'Invalid email':
          errorMessage = '올바른 이메일 형식을 입력해주세요.'
          break
        default:
          if (error.message.includes('email')) {
            errorMessage = '올바른 이메일 형식을 입력해주세요.'
          } else if (error.message.includes('password')) {
            errorMessage = '비밀번호를 확인해주세요.'
          }
      }

      return { data, error: { ...error, message: errorMessage } }
    }

    // 회원가입 성공 시 이메일 인증 대기
    if (!error && data.user) {
      console.log('✅ 회원가입 성공. 이메일 인증을 완료해주세요.')
      console.log('📧 이메일 인증 메일이 발송되었습니다. 스팸함도 확인해주세요.')
    }

    return { data, error }
  },

  signInWithOAuth: async (provider: 'google' | 'kakao' | 'naver') => {
    const supabase = createClient()

    if (provider === 'naver') {
      return { error: { message: '네이버 로그인 기능은 준비 중입니다.' } }
    }

    // returnTo 파라미터 가져오기 - URL과 현재 경로 모두 체크
    const urlParams = new URLSearchParams(window.location.search)
    let returnTo = urlParams.get('returnTo')

    // 일반 사용자는 admin 페이지에 접근할 수 없으므로 사용자 홈으로 리다이렉트
    if (!returnTo || returnTo.startsWith('/admin')) {
      returnTo = '/user/home'
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback?returnTo=${encodeURIComponent(returnTo)}&userRequest=true`,
      }
    })
    return { error }
  },

  signOut: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      set({
        user: null,
        session: null,
        userProfile: null,
        loading: false,
        initialized: false
      })
    }

    return { error }
  },

  fetchUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const supabase = createClient()

    console.log('=== fetchUserProfile 호출됨 ===')
    console.log('사용자 ID:', userId)

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role_id, company, contact, profile_image_url')
        .eq('id', userId)
        .single()

      console.log('프로필 조회 결과:', { data, error })

      if (error) {
        // PGRST116 에러 (no rows)는 정상적인 경우로 처리
        if (error.code === 'PGRST116') {
          console.log('사용자 프로필이 존재하지 않습니다:', userId)
          return null
        }
        console.error('사용자 프로필 조회 오류:', error)
        return null
      }

      console.log('프로필 데이터 반환:', data)
      return data as UserProfile
    } catch (error) {
      console.error('사용자 프로필 조회 중 예외 발생:', error)
      return null
    }
  },

  initializeAuth: async () => {
    const supabase = createClient()
    const state = get()

    console.log('=== initializeAuth 호출됨 ===')
    console.log('이미 초기화됨:', state.initialized)

    // 이미 초기화되었지만 사용자가 없는 경우 다시 초기화
    if (state.initialized && state.user) {
      console.log('이미 초기화되어 스킵')
      return
    }

    console.log('초기화 진행 (사용자 없음 또는 미초기화)')

    try {
      set({ loading: true })

      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      console.log('세션 조회 결과:', session?.user?.email)

      if (session?.user) {
        console.log('세션 사용자 발견, 프로필 조회 시작')
        // 사용자 프로필 정보 가져오기
        const profile = await get().fetchUserProfile(session.user.id)

        if (profile) {
          console.log('프로필 발견, 상태 설정')
          set({
            user: session.user,
            session,
            userProfile: profile,
            loading: false,
            initialized: true
          })
        } else {
          console.log('프로필 없음, 세션 정리')
          // 프로필이 없거나 일반 사용자가 아닌 경우 세션 정리
          await supabase.auth.signOut()
          set({
            user: null,
            session: null,
            userProfile: null,
            loading: false,
            initialized: true
          })
        }
      } else {
        console.log('세션 없음')
        set({
          user: null,
          session: null,
          userProfile: null,
          loading: false,
          initialized: true
        })
      }

      // onAuthStateChange 구독 - 실시간 상태 변경 감지 (한 번만 구독)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('User auth state change:', event, session?.user?.email)

          // 초기화 완료 후에만 상태 변경 처리
          if (!get().initialized) {
            return
          }

          if (session?.user) {
            // 사용자 프로필 정보 다시 가져오기
            const profile = await get().fetchUserProfile(session.user.id)

            if (profile) {
              set({
                user: session.user,
                session,
                userProfile: profile,
              })
            } else {
              // 일반 사용자가 아닌 경우 로그아웃
              await supabase.auth.signOut()
              set({
                user: null,
                session: null,
                userProfile: null,
              })
            }
          } else {
            set({
              user: null,
              session: null,
              userProfile: null,
            })
          }
        }
      )

      // Cleanup subscription
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('User auth initialization error:', error)
      set({
        loading: false,
        initialized: true
      })
    }
  },

  setPasswordResetInProgress: (inProgress: boolean, email?: string) => {
    // 이 함수는 현재 구현되지 않았지만, 인터페이스 호환성을 위해 추가
    console.log('Password reset in progress:', inProgress, email)
  },

  clearPasswordResetState: () => {
    // 이 함수는 현재 구현되지 않았지만, 인터페이스 호환성을 위해 추가
    console.log('Password reset state cleared')
  },

  clearAuthCache: () => {
    // 로컬스토리지에서 auth 관련 데이터 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-auth-store')
      window.location.reload()
    }
  },
}), {
  name: 'user-auth-store',
  partialize: (state) => ({
    user: state.user,
    session: state.session,
    userProfile: state.userProfile,
    initialized: state.initialized
  })
}))
