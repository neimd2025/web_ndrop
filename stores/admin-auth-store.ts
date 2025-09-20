import { getURL } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 관리자 프로필 타입 정의
interface AdminProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin'
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
}

interface AdminAuthState {
  // 관리자 상태
  admin: User | null
  session: Session | null
  adminProfile: AdminProfile | null
  loading: boolean
  initialized: boolean

  // Actions
  setAdmin: (admin: User | null) => void
  setSession: (session: Session | null) => void
  setAdminProfile: (profile: AdminProfile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void

  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ data: any; error: any }>
  signInWithOAuth: (provider: 'google' | 'kakao' | 'naver', returnTo?: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>

  // Profile methods
  fetchAdminProfile: (userId: string) => Promise<AdminProfile | null>
  checkAdminStatus: (userId: string) => Promise<boolean>

  // Initialize auth
  initializeAuth: () => Promise<(() => void) | undefined>
}

export const useAdminAuthStore = create<AdminAuthState>()(persist((set, get) => ({
  admin: null,
  session: null,
  adminProfile: null,
  loading: true,
  initialized: false,

  setAdmin: (admin) => set({ admin }),
  setSession: (session) => set({ session }),
  setAdminProfile: (profile) => set({ adminProfile: profile }),
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
          errorMessage = '가입되지 않은 이메일입니다. 관리자 회원가입을 먼저 진행해주세요.'
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

    // 로그인 성공 시 관리자 권한 확인
    if (data?.user) {
      const isAdmin = await get().checkAdminStatus(data.user.id)
      if (!isAdmin) {
        // 관리자가 아닌 경우 로그아웃 처리
        await supabase.auth.signOut()
        return {
          data: null,
          error: { message: '관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.' }
        }
      }

      const profile = await get().fetchAdminProfile(data.user.id)
      if (profile) {
        set({ adminProfile: profile })
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

    // 이메일 중복 확인 - 관리자 계정으로 이미 가입된 경우 체크
    try {
      const { data: existingAdmin } = await supabase
        .from('user_profiles')
        .select('id, email, role_id')
        .eq('email', email)
        .eq('role_id', 2)
        .single()

      if (existingAdmin) {
        return {
          data: null,
          error: {
            message: '이미 가입된 관리자 이메일입니다. 로그인을 시도해주세요.',
            code: 'ADMIN_ALREADY_EXISTS'
          }
        }
      }
    } catch (error) {
      // 관리자가 없거나 다른 에러인 경우 계속 진행
      console.log('관리자 체크 중 에러 (정상적일 수 있음):', error)
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          name: name || '',
          isAdmin: true
        }
      }
    })

    console.log('📧 관리자 회원가입 결과:', {
      success: !error,
      admin: data?.user?.email,
      error: error?.message
    })

    if (error) {
      let errorMessage = '관리자 회원가입에 실패했습니다. 다시 시도해주세요.'

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

    return { data, error }
  },

  signInWithOAuth: async (provider: 'google' | 'kakao' | 'naver', returnTo: string = '/admin/events') => {
    const supabase = createClient()

    if (provider === 'naver') {
      return { error: { message: '네이버 로그인 기능은 준비 중입니다.' } }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback?returnTo=${encodeURIComponent(returnTo)}&adminRequest=true`,
      }
    })
    return { error }
  },

  signOut: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      set({
        admin: null,
        session: null,
        adminProfile: null,
        loading: false,
        initialized: false
      })
    }

    return { error }
  },

  fetchAdminProfile: async (userId: string): Promise<AdminProfile | null> => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role_id, company, contact, profile_image_url')
        .eq('id', userId)
        .eq('role_id', 2)
        .single()

      if (error) {
        console.error('관리자 프로필 조회 오류:', error)
        return null
      }

      // role_id가 2인 경우 'admin'으로 설정
      return {
        ...data,
        role: 'admin'
      } as AdminProfile
    } catch (error) {
      console.error('관리자 프로필 조회 중 예외 발생:', error)
      return null
    }
  },

  checkAdminStatus: async (userId: string): Promise<boolean> => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('관리자 권한 확인 오류:', error)
        return false
      }

      // role_id가 2인 경우 관리자 (admin)
      return data?.role_id === 2
    } catch (error) {
      console.error('관리자 권한 확인 중 예외 발생:', error)
      return false
    }
  },

  initializeAuth: async () => {
    const supabase = createClient()

    try {
      set({ loading: true })

      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // 관리자 권한 확인
        const isAdmin = await get().checkAdminStatus(session.user.id)

        if (isAdmin) {
          // 관리자 프로필 정보 가져오기
          const profile = await get().fetchAdminProfile(session.user.id)

          set({
            admin: session.user,
            session,
            adminProfile: profile,
          })
        } else {
          // 관리자가 아닌 경우 세션 정리
          await supabase.auth.signOut()
          set({
            admin: null,
            session: null,
            adminProfile: null,
          })
        }
      } else {
        set({
          admin: null,
          session: null,
          adminProfile: null,
        })
      }

      // onAuthStateChange 구독 - 실시간 상태 변경 감지
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Admin auth state change:', event, session?.user?.email)

          if (session?.user) {
            // 관리자 권한 확인
            const isAdmin = await get().checkAdminStatus(session.user.id)

            if (isAdmin) {
              // 관리자 프로필 정보 다시 가져오기
              const profile = await get().fetchAdminProfile(session.user.id)

              set({
                admin: session.user,
                session,
                adminProfile: profile,
              })
            } else {
              // 관리자가 아닌 경우 로그아웃
              await supabase.auth.signOut()
              set({
                admin: null,
                session: null,
                adminProfile: null,
              })
            }
          } else {
            set({
              admin: null,
              session: null,
              adminProfile: null,
            })
          }
          set({ loading: false, initialized: true })
        }
      )

      set({ loading: false, initialized: true })

      // Cleanup subscription
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Admin auth initialization error:', error)
      set({
        loading: false,
        initialized: true
      })
    }
  },
}), {
  name: 'admin-auth-store',
  partialize: (state) => ({
    admin: state.admin,
    session: state.session,
    adminProfile: state.adminProfile,
    initialized: state.initialized
  })
}))