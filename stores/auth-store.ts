import { getURL } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
  introduction?: string | null
  role?: string | null
}

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

type AuthType = 'user' | 'admin'

interface AuthState {
  // User auth
  user: User | null
  userSession: Session | null
  userProfile: UserProfile | null
  userLoading: boolean
  userInitialized: boolean

  // Admin auth
  admin: User | null
  adminSession: Session | null
  adminProfile: AdminProfile | null
  adminLoading: boolean
  adminInitialized: boolean

  // Common actions
  setUserState: (state: Partial<Pick<AuthState, 'user' | 'userSession' | 'userProfile' | 'userLoading' | 'userInitialized'>>) => void
  setAdminState: (state: Partial<Pick<AuthState, 'admin' | 'adminSession' | 'adminProfile' | 'adminLoading' | 'adminInitialized'>>) => void

  // Auth methods
  signInWithEmail: (email: string, password: string, type: AuthType) => Promise<{ data: any; error: any }>
  signUpWithEmail: (email: string, password: string, name?: string, type?: AuthType) => Promise<{ data: any; error: any }>
  signInWithOAuth: (provider: 'google' | 'kakao' | 'naver', type: AuthType, returnTo?: string) => Promise<{ error: any }>
  signOut: (type: AuthType) => Promise<{ error: any }>

  // Profile methods
  fetchProfile: (userId: string) => Promise<{ userProfile: UserProfile | null; adminProfile: AdminProfile | null }>
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>
  fetchAdminProfile: (userId: string) => Promise<AdminProfile | null>

  // Initialize auth
  initializeAuth: (type?: AuthType) => Promise<(() => void) | undefined>

  // Utility methods
  clearAuthCache: () => void
  resetAuth: (type: AuthType) => void
  handleTokenExpired: () => void
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  // User state
  user: null,
  userSession: null,
  userProfile: null,
  userLoading: true,
  userInitialized: false,

  // Admin state
  admin: null,
  adminSession: null,
  adminProfile: null,
  adminLoading: true,
  adminInitialized: false,

  setUserState: (state) => set(state),
  setAdminState: (state) => set(state),

  signInWithEmail: async (email: string, password: string, type: AuthType) => {
    const supabase = createClient()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        data: null,
        error: { message: '올바른 이메일 형식을 입력해주세요.' }
      }
    }

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

    if (data?.user) {
      if (type === 'user') {
        const profile = await get().fetchUserProfile(data.user.id)
        if (profile) {
          set({ userProfile: profile })
        }
      } else {
        const profile = await get().fetchAdminProfile(data.user.id)
        if (profile) {
          set({ adminProfile: profile })
        }
      }
    }

    return { data, error }
  },

  signUpWithEmail: async (email: string, password: string, name?: string, type: AuthType = 'user') => {
    const supabase = createClient()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        data: null,
        error: { message: '올바른 이메일 형식을 입력해주세요.' }
      }
    }

    if (!password || password.length < 6) {
      return {
        data: null,
        error: { message: '비밀번호는 최소 6자 이상이어야 합니다.' }
      }
    }

    const roleId = type === 'admin' ? 2 : 1

    try {
      const { data: existingUsers } = await supabase
        .from('user_profiles')
        .select('id, email, role_id')
        .eq('email', email)
        .eq('role_id', roleId)

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
      console.log('사용자 체크 중 에러 (정상적일 수 있음):', error)
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          name: name || '',
          role_id: roleId
        }
      }
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

    return { data, error }
  },

  signInWithOAuth: async (provider: 'google' | 'kakao' | 'naver', type: AuthType, returnTo?: string) => {
    const supabase = createClient()

    if (provider === 'naver') {
      return { error: { message: '네이버 로그인 기능은 준비 중입니다.' } }
    }

    const urlParams = new URLSearchParams(window.location.search)
    let redirectPath = returnTo || urlParams.get('returnTo')

    if (!redirectPath) {
      redirectPath = type === 'admin' ? '/admin' : '/client/home'
    }

    if (type === 'user' && redirectPath.startsWith('/admin')) {
      redirectPath = '/client/home'
    }

    const userRequest = type === 'user' ? '&userRequest=true' : ''
    const adminRequest = type === 'admin' ? '&adminRequest=true' : ''

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback?returnTo=${encodeURIComponent(redirectPath)}${userRequest}${adminRequest}`,
      }
    })
    return { error }
  },

  signOut: async (type: AuthType) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      if (type === 'user') {
        set({
          user: null,
          userSession: null,
          userProfile: null,
          userLoading: false,
          userInitialized: false
        })
      } else {
        set({
          admin: null,
          adminSession: null,
          adminProfile: null,
          adminLoading: false,
          adminInitialized: false
        })
      }
    }

    return { error }
  },

  // 토큰 만료 에러 처리 함수 (강제 리다이렉트 제거)
  handleTokenExpired: () => {
    console.warn('🔄 토큰이 만료되었습니다. 인증 상태를 초기화합니다.')

    // 모든 인증 상태 초기화
    set({
      user: null,
      userSession: null,
      userProfile: null,
      admin: null,
      adminSession: null,
      adminProfile: null,
    })

    // 강제 리다이렉트 제거 - 사용자가 직접 로그인 페이지로 이동하도록 함
    // 필요시 router.push('/login') 사용
  },

  // 통합된 프로필 조회 함수
  fetchProfile: async (userId: string): Promise<{ userProfile: UserProfile | null; adminProfile: AdminProfile | null }> => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role_id, company, contact, profile_image_url')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { userProfile: null, adminProfile: null }
        }
        console.error('프로필 조회 오류:', error)
        return { userProfile: null, adminProfile: null }
      }

      // role_id에 따라 적절한 프로필 반환
      if (data.role_id === 1) {
        return { userProfile: data as UserProfile, adminProfile: null }
      } else if (data.role_id === 2) {
        return { userProfile: null, adminProfile: { ...data, role: 'admin' } as AdminProfile }
      }

      return { userProfile: null, adminProfile: null }
    } catch (error) {
      console.error('프로필 조회 중 예외 발생:', error)
      return { userProfile: null, adminProfile: null }
    }
  },

  fetchUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { userProfile } = await get().fetchProfile(userId)
    return userProfile
  },

  fetchAdminProfile: async (userId: string): Promise<AdminProfile | null> => {
    const { adminProfile } = await get().fetchProfile(userId)
    return adminProfile
  },

  initializeAuth: async (type?: AuthType) => {
    const supabase = createClient()
    const state = get()

    if (type === 'user' && state.userInitialized && state.user) {
      return
    }
    if (type === 'admin' && state.adminInitialized && state.admin) {
      return
    }

    try {
      if (type === 'user' || !type) {
        set({ userLoading: true })
      }
      if (type === 'admin' || !type) {
        set({ adminLoading: true })
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // 한 번의 쿼리로 사용자와 관리자 프로필 모두 조회
        const { userProfile, adminProfile } = await get().fetchProfile(session.user.id)

        if (type === 'user' || !type) {
          if (userProfile) {
            set({
              user: session.user,
              userSession: session,
              userProfile: userProfile,
              userLoading: false,
              userInitialized: true
            })
          } else {
            set({
              user: null,
              userSession: null,
              userProfile: null,
              userLoading: false,
              userInitialized: true
            })
          }
        }

        if (type === 'admin' || !type) {
          if (adminProfile) {
            set({
              admin: session.user,
              adminSession: session,
              adminProfile: adminProfile,
              adminLoading: false,
              adminInitialized: true
            })
          } else {
            set({
              admin: null,
              adminSession: null,
              adminProfile: null,
              adminLoading: false,
              adminInitialized: true
            })
          }
        }
      } else {
        if (type === 'user' || !type) {
          set({
            user: null,
            userSession: null,
            userProfile: null,
            userLoading: false,
            userInitialized: true
          })
        }
        if (type === 'admin' || !type) {
          set({
            admin: null,
            adminSession: null,
            adminProfile: null,
            adminLoading: false,
            adminInitialized: true
          })
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentState = get()

          // 토큰 갱신 실패 시에만 상태 초기화 (리다이렉트 제거)
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('⚠️ 토큰 갱신 실패 - 세션이 만료되었습니다')
            // 상태만 초기화하고 리다이렉트는 하지 않음
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

          // SIGNED_OUT 이벤트 처리 (자연스러운 로그아웃만)
          if (event === 'SIGNED_OUT') {
            console.log('🔄 사용자가 로그아웃되었습니다')
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

          if (session?.user) {
            // 한 번의 쿼리로 사용자와 관리자 프로필 모두 조회
            const { userProfile, adminProfile } = await get().fetchProfile(session.user.id)

            if (type === 'user' || !type) {
              if (currentState.userInitialized) {
                if (userProfile) {
                  set({
                    user: session.user,
                    userSession: session,
                    userProfile: userProfile,
                  })
                } else {
                  set({
                    user: null,
                    userSession: null,
                    userProfile: null,
                  })
                }
              }
            }

            if (type === 'admin' || !type) {
              if (currentState.adminInitialized) {
                if (adminProfile) {
                  set({
                    admin: session.user,
                    adminSession: session,
                    adminProfile: adminProfile,
                  })
                } else {
                  set({
                    admin: null,
                    adminSession: null,
                    adminProfile: null,
                  })
                }
              }
            }
          } else {
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
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth initialization error:', error)
      if (type === 'user' || !type) {
        set({
          userLoading: false,
          userInitialized: true
        })
      }
      if (type === 'admin' || !type) {
        set({
          adminLoading: false,
          adminInitialized: true
        })
      }
    }
  },

  clearAuthCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-store')
      localStorage.removeItem('user-auth-store')
      localStorage.removeItem('admin-auth-store')
      window.location.reload()
    }
  },

  resetAuth: (type: AuthType) => {
    if (type === 'user') {
      set({
        user: null,
        userSession: null,
        userProfile: null,
        userLoading: true,
        userInitialized: false
      })
    } else {
      set({
        admin: null,
        adminSession: null,
        adminProfile: null,
        adminLoading: true,
        adminInitialized: false
      })
    }
  },
}), {
  name: 'auth-store',
  partialize: (state) => ({
    user: state.user,
    userSession: state.userSession,
    userProfile: state.userProfile,
    userInitialized: state.userInitialized,
    admin: state.admin,
    adminSession: state.adminSession,
    adminProfile: state.adminProfile,
    adminInitialized: state.adminInitialized
  })
}))
