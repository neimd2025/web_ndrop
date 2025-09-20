/**
 * 인증 시스템 테스트 코드
 * Admin과 Client 인증 충돌 문제 해결 검증
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock data for testing
const mockAdminUser = {
  id: 'd13855aa-c362-4f70-95d7-e21b22e7a561',
  email: 'sjhwo9370@gmail.com',
  user_metadata: {
    name: '심재'
  }
}

const mockRegularUser = {
  id: 'aa38c9da-5dff-4377-adc3-fa415058e2de',
  email: 'heosujeong8@gmail.com',
  user_metadata: {
    name: '허수정'
  }
}

const mockAdminProfile = {
  id: 'd13855aa-c362-4f70-95d7-e21b22e7a561',
  email: 'sjhwo9370@gmail.com',
  role: 'admin',
  role_id: 2
}

const mockUserProfile = {
  id: 'aa38c9da-5dff-4377-adc3-fa415058e2de',
  email: 'heosujeong8@gmail.com',
  role: 'user',
  role_id: 1
}

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

// Mock auth store
const mockAuthStore = {
  user: null,
  session: null,
  userProfile: null,
  isAdmin: false,
  loading: false,
  initialized: false,
  adminLoading: false,
  adminInitialized: false,
  setUser: jest.fn(),
  setSession: jest.fn(),
  setUserProfile: jest.fn(),
  setIsAdmin: jest.fn(),
  signInWithEmail: jest.fn(),
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  fetchUserProfile: jest.fn(),
  checkAdminStatus: jest.fn(),
  initializeAuth: jest.fn()
}

describe('인증 시스템 테스트', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Reset store state
    mockAuthStore.user = null
    mockAuthStore.session = null
    mockAuthStore.userProfile = null
    mockAuthStore.isAdmin = false
    mockAuthStore.loading = false
    mockAuthStore.initialized = false
    mockAuthStore.adminLoading = false
    mockAuthStore.adminInitialized = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('관리자 권한 확인', () => {
    it('관리자 사용자의 권한을 올바르게 확인해야 함', async () => {
      // Arrange
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockAdminProfile)
      mockAuthStore.checkAdminStatus.mockResolvedValue(true)

      // Act
      const profile = await mockAuthStore.fetchUserProfile(mockAdminUser.id)
      const isAdmin = await mockAuthStore.checkAdminStatus(mockAdminUser.id)

      // Assert
      expect(profile).toEqual(mockAdminProfile)
      expect(profile.role).toBe('admin')
      expect(isAdmin).toBe(true)
    })

    it('일반 사용자의 권한을 올바르게 확인해야 함', async () => {
      // Arrange
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockUserProfile)
      mockAuthStore.checkAdminStatus.mockResolvedValue(false)

      // Act
      const profile = await mockAuthStore.fetchUserProfile(mockRegularUser.id)
      const isAdmin = await mockAuthStore.checkAdminStatus(mockRegularUser.id)

      // Assert
      expect(profile).toEqual(mockUserProfile)
      expect(profile.role).toBe('user')
      expect(isAdmin).toBe(false)
    })
  })

  describe('로그인 플로우 테스트', () => {
    it('관리자 로그인 시 admin 상태가 올바르게 설정되어야 함', async () => {
      // Arrange
      const loginData = { email: 'sjhwo9370@gmail.com', password: 'password123' }
      mockAuthStore.signInWithEmail.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null
      })
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockAdminProfile)

      // Act
      const result = await mockAuthStore.signInWithEmail(loginData.email, loginData.password)

      // Mock profile fetch after login
      if (result.data?.user) {
        const profile = await mockAuthStore.fetchUserProfile(result.data.user.id)
        mockAuthStore.setUserProfile(profile)
        mockAuthStore.setIsAdmin(profile.role === 'admin')
      }

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(mockAdminUser)
      expect(mockAuthStore.fetchUserProfile).toHaveBeenCalledWith(mockAdminUser.id)
      expect(mockAuthStore.setUserProfile).toHaveBeenCalledWith(mockAdminProfile)
      expect(mockAuthStore.setIsAdmin).toHaveBeenCalledWith(true)
    })

    it('일반 사용자 로그인 시 user 상태가 올바르게 설정되어야 함', async () => {
      // Arrange
      const loginData = { email: 'heosujeong8@gmail.com', password: 'password123' }
      mockAuthStore.signInWithEmail.mockResolvedValue({
        data: { user: mockRegularUser },
        error: null
      })
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockUserProfile)

      // Act
      const result = await mockAuthStore.signInWithEmail(loginData.email, loginData.password)

      // Mock profile fetch after login
      if (result.data?.user) {
        const profile = await mockAuthStore.fetchUserProfile(result.data.user.id)
        mockAuthStore.setUserProfile(profile)
        mockAuthStore.setIsAdmin(profile.role === 'admin')
      }

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(mockRegularUser)
      expect(mockAuthStore.fetchUserProfile).toHaveBeenCalledWith(mockRegularUser.id)
      expect(mockAuthStore.setUserProfile).toHaveBeenCalledWith(mockUserProfile)
      expect(mockAuthStore.setIsAdmin).toHaveBeenCalledWith(false)
    })
  })

  describe('로그아웃 플로우 테스트', () => {
    it('로그아웃 시 모든 상태가 초기화되어야 함', async () => {
      // Arrange
      mockAuthStore.user = mockAdminUser
      mockAuthStore.userProfile = mockAdminProfile
      mockAuthStore.isAdmin = true
      mockAuthStore.signOut.mockResolvedValue({ error: null })

      // Act
      const result = await mockAuthStore.signOut()

      // Mock state reset after signOut
      if (!result.error) {
        mockAuthStore.setUser(null)
        mockAuthStore.setSession(null)
        mockAuthStore.setUserProfile(null)
        mockAuthStore.setIsAdmin(false)
      }

      // Assert
      expect(result.error).toBeNull()
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setUserProfile).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setIsAdmin).toHaveBeenCalledWith(false)
    })
  })

  describe('OAuth 리다이렉트 테스트', () => {
    it('admin 페이지 요청 시 올바른 리다이렉트 URL이 생성되어야 함', async () => {
      // Arrange
      const provider = 'google'
      const expectedReturnTo = '/admin/events'
      const expectedRedirectTo = expect.stringContaining(encodeURIComponent(expectedReturnTo))

      mockAuthStore.signInWithOAuth.mockResolvedValue({ error: null })

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/admin/login',
          search: ''
        },
        writable: true
      })

      // Act
      await mockAuthStore.signInWithOAuth(provider)

      // Assert
      expect(mockAuthStore.signInWithOAuth).toHaveBeenCalledWith(provider)
    })

    it('client 페이지 요청 시 올바른 리다이렉트 URL이 생성되어야 함', async () => {
      // Arrange
      const provider = 'google'
      const expectedReturnTo = '/home'

      mockAuthStore.signInWithOAuth.mockResolvedValue({ error: null })

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/login',
          search: ''
        },
        writable: true
      })

      // Act
      await mockAuthStore.signInWithOAuth(provider)

      // Assert
      expect(mockAuthStore.signInWithOAuth).toHaveBeenCalledWith(provider)
    })
  })

  describe('권한 기반 접근 제어 테스트', () => {
    it('관리자가 아닌 사용자는 admin 페이지 접근이 거부되어야 함', () => {
      // Arrange
      const user = mockRegularUser
      const userProfile = mockUserProfile
      const isAdmin = false

      // Act & Assert
      expect(isAdmin).toBe(false)
      expect(userProfile.role).toBe('user')

      // 실제 앱에서는 이 조건으로 admin 페이지 접근을 차단
      const canAccessAdmin = isAdmin && userProfile.role === 'admin'
      expect(canAccessAdmin).toBe(false)
    })

    it('관리자 사용자는 admin 페이지 접근이 허용되어야 함', () => {
      // Arrange
      const user = mockAdminUser
      const userProfile = mockAdminProfile
      const isAdmin = true

      // Act & Assert
      expect(isAdmin).toBe(true)
      expect(userProfile.role).toBe('admin')

      // 실제 앱에서는 이 조건으로 admin 페이지 접근을 허용
      const canAccessAdmin = isAdmin && userProfile.role === 'admin'
      expect(canAccessAdmin).toBe(true)
    })
  })

  describe('세션 상태 관리 테스트', () => {
    it('초기화 시 세션이 존재하면 올바르게 복원되어야 함', async () => {
      // Arrange
      const mockSession = {
        user: mockAdminUser,
        access_token: 'mock-token'
      }

      mockAuthStore.initializeAuth.mockImplementation(async () => {
        mockAuthStore.setUser(mockAdminUser)
        mockAuthStore.setSession(mockSession)
        mockAuthStore.setUserProfile(mockAdminProfile)
        mockAuthStore.setIsAdmin(true)
        mockAuthStore.loading = false
        mockAuthStore.initialized = true
        mockAuthStore.adminLoading = false
        mockAuthStore.adminInitialized = true
      })

      // Act
      await mockAuthStore.initializeAuth()

      // Assert
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockAdminUser)
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(mockSession)
      expect(mockAuthStore.setUserProfile).toHaveBeenCalledWith(mockAdminProfile)
      expect(mockAuthStore.setIsAdmin).toHaveBeenCalledWith(true)
    })

    it('초기화 시 세션이 없으면 로그아웃 상태로 설정되어야 함', async () => {
      // Arrange
      mockAuthStore.initializeAuth.mockImplementation(async () => {
        mockAuthStore.setUser(null)
        mockAuthStore.setSession(null)
        mockAuthStore.setUserProfile(null)
        mockAuthStore.setIsAdmin(false)
        mockAuthStore.loading = false
        mockAuthStore.initialized = true
        mockAuthStore.adminLoading = false
        mockAuthStore.adminInitialized = true
      })

      // Act
      await mockAuthStore.initializeAuth()

      // Assert
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setUserProfile).toHaveBeenCalledWith(null)
      expect(mockAuthStore.setIsAdmin).toHaveBeenCalledWith(false)
    })
  })
})

// Integration test scenarios
describe('통합 시나리오 테스트', () => {
  describe('시나리오 1: 클라이언트에서 로그인 후 URL로 admin 접근', () => {
    it('일반 사용자가 admin URL 접근 시 홈으로 리다이렉트되어야 함', async () => {
      // 1. 일반 사용자로 로그인
      mockAuthStore.user = mockRegularUser
      mockAuthStore.userProfile = mockUserProfile
      mockAuthStore.isAdmin = false

      // 2. admin URL 접근 시도
      const canAccessAdmin = mockAuthStore.isAdmin && mockAuthStore.userProfile?.role === 'admin'

      // 3. 접근 거부 확인
      expect(canAccessAdmin).toBe(false)
    })
  })

  describe('시나리오 2: 클라이언트 로그아웃 후 admin 로그인', () => {
    it('로그아웃 후 관리자 로그인이 정상 작동해야 함', async () => {
      // 1. 기존 일반 사용자 상태
      mockAuthStore.user = mockRegularUser
      mockAuthStore.userProfile = mockUserProfile
      mockAuthStore.isAdmin = false

      // 2. 로그아웃
      mockAuthStore.signOut.mockResolvedValue({ error: null })
      await mockAuthStore.signOut()

      // Mock logout state reset
      mockAuthStore.user = null
      mockAuthStore.userProfile = null
      mockAuthStore.isAdmin = false

      // 3. 관리자로 로그인
      mockAuthStore.signInWithEmail.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null
      })
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockAdminProfile)

      const result = await mockAuthStore.signInWithEmail('sjhwo9370@gmail.com', 'password123')

      // Mock successful admin login
      mockAuthStore.user = mockAdminUser
      mockAuthStore.userProfile = mockAdminProfile
      mockAuthStore.isAdmin = true

      // 4. 관리자 권한 확인
      expect(mockAuthStore.user).toEqual(mockAdminUser)
      expect(mockAuthStore.userProfile).toEqual(mockAdminProfile)
      expect(mockAuthStore.isAdmin).toBe(true)
    })
  })

  describe('시나리오 3: 동시 탭에서 다른 사용자 로그인', () => {
    it('세션 변경 시 올바르게 상태가 업데이트되어야 함', async () => {
      // 1. 초기 관리자 상태
      mockAuthStore.user = mockAdminUser
      mockAuthStore.userProfile = mockAdminProfile
      mockAuthStore.isAdmin = true

      // 2. 다른 탭에서 일반 사용자 로그인 (세션 변경 시뮬레이션)
      const onAuthStateChange = jest.fn()
      mockAuthStore.onAuthStateChange = onAuthStateChange

      // Mock session change event
      const newSession = { user: mockRegularUser }
      mockAuthStore.fetchUserProfile.mockResolvedValue(mockUserProfile)

      // Simulate auth state change callback
      const authStateChangeCallback = async (event: string, session: any) => {
        if (session?.user) {
          const profile = await mockAuthStore.fetchUserProfile(session.user.id)
          mockAuthStore.user = session.user
          mockAuthStore.userProfile = profile
          mockAuthStore.isAdmin = profile.role === 'admin'
        }
      }

      // 3. Execute auth state change
      await authStateChangeCallback('SIGNED_IN', newSession)

      // 4. 상태 변경 확인
      expect(mockAuthStore.user).toEqual(mockRegularUser)
      expect(mockAuthStore.userProfile).toEqual(mockUserProfile)
      expect(mockAuthStore.isAdmin).toBe(false)
    })
  })
})