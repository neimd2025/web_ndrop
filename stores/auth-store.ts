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
  role: 'admin' | 'user'
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
}

interface AuthState {
  // 기본 사용자 상태
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  initialized: boolean

  // 관리자 관련 상태
  isAdmin: boolean
  adminLoading: boolean
  adminInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setIsAdmin: (isAdmin: boolean) => void

  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUpWithEmail: (email: string, password: string, name?: string, isAdmin?: boolean) => Promise<{ data: any; error: any }>
  signInWithOAuth: (provider: 'google' | 'kakao' | 'naver') => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>

  // Profile methods
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>
  checkAdminStatus: (userId: string) => Promise<boolean>

  // Initialize auth
  initializeAuth: () => Promise<(() => void) | undefined>

  // Admin user getter (backward compatibility)
  adminUser: User | null

  // Password reset methods
  setPasswordResetInProgress: (inProgress: boolean, email?: string) => void
  clearPasswordResetState: () => void
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  initialized: false,
  isAdmin: false,
  adminLoading: true,
  adminInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  // Backward compatibility getter
  get adminUser() {
    const state = get()
    return state.isAdmin ? state.user : null
  },

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

    // 로그인 성공 시 프로필 정보 가져오기
    if (data?.user) {
      const profile = await get().fetchUserProfile(data.user.id)
      if (profile) {
        set({ userProfile: profile, isAdmin: profile.role === 'admin' })
      }
    }

    return { data, error }
  },

  signUpWithEmail: async (email: string, password: string, name?: string, isAdmin?: boolean) => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          name: name || '',
          isAdmin: isAdmin || false
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

    // returnTo 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search)
    const returnTo = urlParams.get('returnTo') || '/home'

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
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
        isAdmin: false,
        adminLoading: false,
        adminInitialized: false
      })
    }

    return { error }
  },

  fetchUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, role_id, company, contact, profile_image_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('프로필 조회 오류:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('프로필 조회 중 예외 발생:', error)
      return null
    }
  },

  checkAdminStatus: async (userId: string): Promise<boolean> => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('관리자 권한 확인 오류:', error)
        return false
      }

      return data?.role === 'admin'
    } catch (error) {
      console.error('관리자 권한 확인 중 예외 발생:', error)
      return false
    }
  },

  initializeAuth: async () => {
    const supabase = createClient()

    try {
      set({ loading: true, adminLoading: true })

      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // 사용자 프로필 정보 가져오기
        const profile = await get().fetchUserProfile(session.user.id)
        const isAdmin = profile?.role === 'admin' || false

        set({
          user: session.user,
          session,
          userProfile: profile,
          isAdmin,
          adminLoading: false,
          adminInitialized: true
        })
      } else {
        set({
          user: null,
          session: null,
          userProfile: null,
          isAdmin: false,
          adminLoading: false,
          adminInitialized: true
        })
      }

      // onAuthStateChange 구독 - 실시간 상태 변경 감지
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email)

          if (session?.user) {
            // 프로필 정보 다시 가져오기
            const profile = await get().fetchUserProfile(session.user.id)
            const isAdmin = profile?.role === 'admin' || false

            set({
              user: session.user,
              session,
              userProfile: profile,
              isAdmin,
              adminLoading: false,
              adminInitialized: true
            })
          } else {
            set({
              user: null,
              session: null,
              userProfile: null,
              isAdmin: false,
              adminLoading: false,
              adminInitialized: true
            })
          }
          set({ loading: false, initialized: true })
        }
      )

      set({ loading: false, initialized: true })

      // Cleanup subscription
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({
        loading: false,
        initialized: true,
        adminLoading: false,
        adminInitialized: true
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
}), {
  name: 'auth-store',
  partialize: (state) => ({
    user: state.user,
    session: state.session,
    userProfile: state.userProfile,
    isAdmin: state.isAdmin,
    initialized: state.initialized,
    adminInitialized: state.adminInitialized
  })
}))