//@ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  company?: string
  role?: string
  job_title?: string // ✅ job_title 필드 추가
  profile_image_url?: string
  created_at: string
  // 추가 필드들
  birth_date?: string
  mbti?: string
  contact?: string
  introduction?: string
  external_link?: string
  keywords?: string[]
  personality_keywords?: string[]
  interest_keywords?: string[]
  hobby_keywords?: string[]
  work_field?: string
  affiliation?: string
  affiliation_type?: string
  nickname?: string
}

export interface UserEvent {
  id: string
  title: string
  description: string
  event_code: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  current_participants: number
  status: 'upcoming' | 'ongoing' | 'completed'
  created_at: string
}

export interface UserBusinessCard {
  id: string
  user_id: string
  template_id?: string
  name: string
  company: string
  affiliation?: string
  title: string
  job_title?: string // ✅ job_title 필드 추가
  email: string
  phone?: string
  website?: string
  bio?: string
  qr_code_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
  // 추가 필드들
  full_name?: string
  introduction?: string
  mbti?: string
  contact?: string
  external_link?: string
  keywords?: string[]
  work_field?: string
  profile_image_url?: string
  birth_date?: string
  personality_keywords?: string[]
  interest_keywords?: string[]
  hobby_keywords?: string[]
  role?: string
}

export interface UserNotification {
  id: string
  title: string
  message: string
  target_type: 'all' | 'specific' | 'event_participants'
  target_event_id?: string
  user_id?: string
  sent_by?: string
  read_at?: string
  created_at: string
  notification_type: 'announcement' | 'business_card_collected' | 'event_joined' | 'event_created' | 'profile_updated' | 'system' | 'meeting_request' | 'meeting_chat'
  metadata?: Record<string, any>
  related_user_id?: string
  related_business_card_id?: string
  related_event_id?: string
}

export interface UserEventParticipation {
  id: string
  event_id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  registered_at: string
  event: UserEvent
}

interface GetUserAuthOptions {
  requireAuth?: boolean  // 인증 필수 여부
  throwOnError?: boolean // 에러 발생 시 예외 던질지 여부
  maxProfileRetries?: number // 프로필 조회 최대 재시도 횟수
}

// 프로필 조회 재시도 함수
async function getUserProfileWithRetry(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxRetries = 3,
  initialDelay = 500
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // 🔥 .single() 대신 .maybeSingle()

      // 프로필이 있으면 반환
      if (profile && !error) {
        console.log(`프로필 조회 성공 (시도 ${attempt})`)
        return profile
      }

      // 프로필이 없으면 생성 시도 (첫 번째 시도에서만)
      if (attempt === 1 && (!profile || error?.code === 'PGRST116')) {
        console.log(`사용자 프로필 없음, 생성 시도 (${userId})`)
        
        const { data: userData } = await supabase.auth.getUser()
        const userEmail = userData.user?.email || ''
        
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
          })

        if (insertError && insertError.code !== '23505') {
          console.error('프로필 생성 오류:', insertError)
        } else {
          console.log('프로필 생성 완료')
        }

        // 생성 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 300))
        continue // 생성 후 다시 조회
      }

      // 재시도
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(1.5, attempt - 1)
        console.log(`프로필 재시도 ${attempt}/${maxRetries}, ${delay}ms 후 재시도`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.error(`프로필 조회 시도 ${attempt} 실패:`, error)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * attempt))
      }
    }
  }
  
  console.warn(`프로필 조회 실패 (최대 재시도 ${maxRetries}회)`)
  return null
}

// 세션 복구 함수
async function recoverUserSession(supabase: ReturnType<typeof createClient>) {
  try {
    // 1. getUser() 먼저 시도
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('getUser 실패, getSession 시도:', userError.message)
      // getUser 실패 시 getSession으로 폴백
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user || null
    }
    
    return user
  } catch (error) {
    console.error('세션 복구 오류:', error)
    return null
  }
}

export async function getUserAuth(options: GetUserAuthOptions = {}): Promise<UserProfile | null> {
  const { 
    requireAuth = true, 
    throwOnError = false,
    maxProfileRetries = 3
  } = options
  
  try {
    const supabase = await createClient()

    // 🔥 세션 복구 시도
    const user = await recoverUserSession(supabase)

    if (!user) {
      if (requireAuth) {
        if (throwOnError) {
          throw new Error('인증이 필요합니다')
        }
        console.warn('인증 필요')
        return null
      }
      // 🔥 인증이 필수가 아닌 경우 null 반환
      return null
    }

    // 🔥 프로필 조회 재시도 로직 적용
    const profile = await getUserProfileWithRetry(supabase, user.id, maxProfileRetries)

    if (!profile) {
      // 프로필이 없어도 기본 정보 반환
      return {
        id: user.id,
        email: user.email!,
        created_at: user.created_at
      } as UserProfile
    }

    return {
      ...profile,
      email: user.email!, // 최신 이메일 정보 사용
      created_at: user.created_at
    } as UserProfile
  } catch (error) {
    if (throwOnError) {
      throw error
    }
    
    console.warn('사용자 인증 확인 오류:', error)
    return null
  }
}

export async function requireUserAuth(options: { 
  maxRetries?: number,
  redirectTo?: string 
} = {}): Promise<UserProfile> {
  const { maxRetries = 2, redirectTo } = options
  
  let user: UserProfile | null = null
  
  // 최대 2회 재시도
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    user = await getUserAuth({ 
      requireAuth: false, 
      throwOnError: false,
      maxProfileRetries: 3 
    })
    
    if (user) break
    
    // 마지막 시도가 아니면 대기 후 재시도
    if (attempt < maxRetries) {
      const delay = 500 * attempt
      console.log(`인증 재시도 ${attempt}/${maxRetries}, ${delay}ms 후 재시도`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  if (!user) {
    const headersList = await headers()
    const referer = headersList.get('referer')
    const fromPath = referer || '/'
    
    const redirectUrl = redirectTo || `/login?type=user&from=${encodeURIComponent(fromPath)}`
    
    // 헤더를 직접 설정하여 리다이렉트 대신 next/navigation의 redirect 사용
    redirect(redirectUrl)
  }
  
  return user
}

// 🔥 새로운 함수: 사용자 인증 상태 확인 (지연 대기 포함)
export async function waitForUserAuth(
  timeout = 5000,
  interval = 500
): Promise<UserProfile | null> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const user = await getUserAuth({ 
      requireAuth: false, 
      throwOnError: false,
      maxProfileRetries: 1 // 빠른 확인
    })
    
    if (user) {
      console.log('사용자 인증 대기 성공:', user.id)
      return user
    }
    
    // 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  console.warn(`사용자 인증 대기 시간 초과 (${timeout}ms)`)
  return null
}

// 🔥 새로운 함수: 세션 강제 갱신
export async function forceRefreshUserSession(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    
    // 세션 강제 갱신
    const { data: { session } } = await supabase.auth.refreshSession()
    
    if (!session?.user) {
      return null
    }
    
    // 프로필 정보 가져오기
    const profile = await getUserProfileWithRetry(supabase, session.user.id, 2, 1000)
    
    if (!profile) {
      return {
        id: session.user.id,
        email: session.user.email!,
        created_at: session.user.created_at
      } as UserProfile
    }
    
    return {
      ...profile,
      email: session.user.email!,
      created_at: session.user.created_at
    } as UserProfile
  } catch (error) {
    console.error('세션 강제 갱신 오류:', error)
    return null
  }
}

// 🔥 새로운 함수: 인증 상태 확인 및 리다이렉트 처리
export async function checkAndRedirectAuth(
  requireAuthType: 'user' | 'admin' = 'user',
  fallbackRedirect = '/login'
) {
  const user = await getUserAuth({ requireAuth: false })
  
  if (!user) {
    const headersList = await headers()
    const referer = headersList.get('referer') || '/'
    
    // 인증 실패 시 명시적으로 로그아웃 라우트로 이동하여 쿠키 삭제 후 로그인 페이지로
    redirect(`/auth/signout?type=${requireAuthType}&from=${encodeURIComponent(referer)}`)
  }
  
  // 관리자 권한 확인 (필요한 경우)
  if (requireAuthType === 'admin' && user.role !== 'admin') {
    redirect(`/unauthorized?from=${encodeURIComponent(referer)}`)
  }
  
  return user
}

export async function getUserHomeData(): Promise<{
  user: UserProfile
  upcomingEvents: UserEvent[]
  recentNotifications: UserNotification[]
  businessCardStats: {
    totalViews: number
    totalShares: number
    publicCards: number
  }
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 온보딩 체크는 클라이언트 레이아웃에서 처리하므로 여기서는 제거

    const [eventsResult, notificationsResult, businessCardsResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true })
        .limit(3),

      supabase
        .from('notifications')
        .select('*')
        .or(`target_type.eq.all,user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
    ])

    const upcomingEvents = eventsResult.data || []
    const recentNotifications = notificationsResult.data || []
    const businessCards = businessCardsResult.data || []

    const businessCardStats = {
      totalViews: businessCards.reduce((sum, card) => sum + (card.view_count || 0), 0),
      totalShares: businessCards.reduce((sum, card) => sum + (card.share_count || 0), 0),
      publicCards: businessCards.filter(card => card.is_public).length
    }

    return {
      user,
      upcomingEvents,
      recentNotifications,
      businessCardStats
    }
  } catch (error) {
    console.error('홈 데이터 가져오기 오류:', error)
    throw new Error('홈 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserEventsData(): Promise<{
  user: UserProfile
  events: UserEvent[]
  userParticipations: UserEventParticipation[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 사용자가 참여한 모든 이벤트 가져오기 (status 무관)
    const participationsResult = await supabase
      .from('event_participants')
      .select(`
        *,
        event:events(*)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    const userParticipations = participationsResult.data || []

    // 참여한 이벤트들을 UserEvent 형태로 변환
    const events = userParticipations.map(participation => participation.event).filter(Boolean)

    return {
      user,
      events,
      userParticipations
    }
  } catch (error) {
    console.error('이벤트 데이터 가져오기 오류:', error)
    throw new Error('이벤트 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserEventsAvailableData(): Promise<{
  user: UserProfile
  availableEvents: UserEvent[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 참가 가능한 모든 이벤트 가져오기
    const eventsResult = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    const availableEvents = eventsResult.data || []

    return {
      user,
      availableEvents
    }
  } catch (error) {
    console.error('참가 가능한 이벤트 데이터 가져오기 오류:', error)
    throw new Error('참가 가능한 이벤트 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserBusinessCardsData(): Promise<{
  user: UserProfile
  businessCards: UserBusinessCard[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 사용자 프로필에서 모든 필드 가져오기
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('사용자 프로필 가져오기 오류:', profileError)
    }

    // 명함 데이터 가져오기
    const { data: businessCards, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('명함 데이터 가져오기 오류:', error)
      throw new Error('명함 데이터를 불러올 수 없습니다.')
    }

    // 사용자 프로필 데이터와 명함 데이터를 병합
    const enrichedUser = userProfile ? { ...user, ...userProfile } : user

    return {
      user: enrichedUser,
      businessCards: businessCards || []
    }
  } catch (error) {
    console.error('명함 데이터 가져오기 오류:', error)
    throw new Error('명함 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserNotificationsData(): Promise<{
  user: UserProfile
  notifications: UserNotification[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 모든 알림을 가져와서 필터링
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('알림 데이터 가져오기 오류:', error)
      throw new Error('알림 데이터를 불러올 수 없습니다.')
    }

    // 사용자에게 보여줄 알림 필터링
    const notifications = allNotifications?.filter(notification => {
      // 전체 대상 알림이거나
      if (notification.target_type === 'all') {
        return true
      }

      // 특정 사용자 대상 알림인 경우 (실제 스키마에 맞춤)
      if (notification.target_type === 'specific') {
        return notification.user_id === user.id
      }

      // event_participants 타입도 확인 (관리자 공지용)
      if (notification.target_type === 'event_participants') {
        return true
      }

      return false
    }) || []

    return {
      user,
      notifications: notifications || []
    }
  } catch (error) {
    console.error('알림 데이터 가져오기 오류:', error)
    throw new Error('알림 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserMyPageData(): Promise<{
  user: UserProfile
  businessCards: UserBusinessCard[]
  participatedEvents: UserEventParticipation[]
  stats: {
    totalEvents: number
    totalBusinessCards: number
    profileViews: number
  }
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    // 사용자 프로필 정보도 함께 가져오기
    const [userProfileResult, businessCardsResult, participationsResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),

      supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('event_participants')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('registered_at', { ascending: false })
    ])

    const businessCards = businessCardsResult.data || []
    const participatedEvents = participationsResult.data || []

    // 사용자 프로필 데이터와 기본 사용자 데이터 병합
    const enrichedUser = userProfileResult.data ? { ...user, ...userProfileResult.data } : user

    const stats = {
      totalEvents: participatedEvents.length,
      totalBusinessCards: businessCards.length,
      profileViews: businessCards.reduce((sum, card) => sum + (card.view_count || 0), 0)
    }

    return {
      user: enrichedUser,
      businessCards,
      participatedEvents,
      stats
    }
  } catch (error) {
    console.error('마이페이지 데이터 가져오기 오류:', error)
    throw error;
  }
}

export async function getUserSavedCardsData(): Promise<{
  user: UserProfile
  savedCards: any[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    const { data: savedCards, error } = await supabase
      .from('collected_cards')
      .select(`
        *,
        business_card:business_cards(*)
      `)
      .eq('collector_id', user.id)
      .not('business_cards.user_id', 'eq', user.id)
      .order('collected_at', { ascending: false })

    if (error) {
      console.error('저장된 명함 데이터 가져오기 오류:', error)
      throw new Error('저장된 명함 데이터를 불러올 수 없습니다.')
    }

    return {
      user,
      savedCards: savedCards || []
    }
  } catch (error) {
    console.error('저장된 명함 데이터 가져오기 오류:', error)
    throw new Error('저장된 명함 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserSavedCardsDataFromId(id?: string): Promise<{
  user: UserProfile
  savedCards: any[]
  cardOwner?: UserProfile
}> {
  const user = await requireUserAuth()
  
  if (!id) {
    return {
      user,
      savedCards: [],
      cardOwner: undefined
    }
  }

  try {
    const supabase = await createClient()

    // 1. 먼저 collected_cards에서 해당 id의 card_id를 찾습니다
    const { data: collectedCard, error: collectedError } = await supabase
      .from('collected_cards')
      .select('card_id')
      .eq('id', id)
      .single()

    if (collectedError) {
      console.log('수집된 명함 ID 찾기 오류:', collectedError)
      return {
        user,
        savedCards: [],
        cardOwner: undefined
      }
    }

    // 2. 찾은 card_id로 명함 정보와 함께 소유자 프로필도 조회
    const { data: savedCards, error } = await supabase
      .from('business_cards')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('id', collectedCard.card_id)

    if (error) {
      console.error('명함 데이터 가져오기 오류:', error)
      throw new Error('명함 데이터를 불러올 수 없습니다.')
    }

    // 카드 소유자 정보 추출
    let cardOwner: UserProfile | undefined = undefined
    if (savedCards && savedCards.length > 0 && savedCards[0].user_profile) {
      cardOwner = savedCards[0].user_profile
    }

    return {
      user,
      savedCards: savedCards || [],
      cardOwner
    }
  } catch (error) {
    console.error('저장된 명함 데이터 가져오기 오류:', error)
    throw new Error('저장된 명함 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserCardFromId(cardId: string): Promise<{
  user: UserProfile | null
  cardData: UserBusinessCard | null
  cardOwner: UserProfile | null
  isCollected: boolean
  cardType: 'business_card' | 'collected_card' | 'none'
}> {
  console.log('🔍 getUserCardFromId 시작, cardId:', cardId)
  
  try {
    const user = await getUserAuth({ requireAuth: false })
    console.log('👤 인증된 사용자:', user ? `ID: ${user.id}` : '없음')
    
    const supabase = await createClient()
    
    // 1. 명함 찾기
    console.log('1️⃣ business_cards에서 명함 찾기...')
    const { data: businessCard, error: cardError } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', cardId)
      .maybeSingle()

    if (cardError) {
      console.error('명함 조회 에러:', cardError)
    }

    if (!businessCard) {
      console.log('❌ business_cards에서 명함을 찾을 수 없음')
      
      // collected_cards에서 시도
      console.log('🔄 collected_cards에서 시도...')
      const { data: collectedCard } = await supabase
        .from('collected_cards')
        .select(`
          *,
          business_card:business_cards(*)
        `)
        .eq('id', cardId)
        .maybeSingle()

      if (collectedCard?.business_card) {
        const card = collectedCard.business_card
        console.log('✅ collected_cards에서 명함 발견:', card.id)
        
        // cardOwner 찾기
        console.log(`🔍 명함 소유자 찾기 (user_id: ${card.user_id})...`)
        const { data: ownerProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', card.user_id)
          .maybeSingle()
        
        console.log('소유자 프로필 결과:', ownerProfile ? '찾음' : '없음')
        
        return {
          user: user, // null일 수 있음
          cardData: card,
          cardOwner: ownerProfile,
          isCollected: true,
          cardType: 'collected_card'
        }
      }
      
      return {
        user: user, // null일 수 있음
        cardData: null,
        cardOwner: null,
        isCollected: false,
        cardType: 'none'
      }
    }

    console.log('✅ business_cards에서 명함 발견:', businessCard.id)
    console.log('📌 명함 소유자 user_id:', businessCard.user_id)
    
    // 2. 명함 소유자 프로필 찾기
    console.log('2️⃣ user_profiles에서 소유자 프로필 찾기...')
    const { data: ownerProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', businessCard.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('소유자 프로필 조회 에러:', profileError)
    }
    
    console.log('소유자 프로필:', ownerProfile)
    
    // 3. 수집 여부 확인 (사용자가 있을 때만)
    let isCollected = false
    if (user) {
      console.log('3️⃣ 수집 여부 확인 (사용자 있음)...')
      const { data: collections } = await supabase
        .from('collected_cards')
        .select('id')
        .eq('card_id', cardId)
        .eq('collector_id', user.id)
        .limit(1)

      isCollected = collections && collections.length > 0
      console.log('수집 여부:', isCollected)
    } else {
      console.log('3️⃣ 사용자 없음 - 수집 여부 확인 생략')
    }
    
    // 4. cardOwner 정보 정리
    let cardOwner: UserProfile | null = null
    
    if (ownerProfile) {
      // user_profiles에서 찾은 경우
      cardOwner = ownerProfile
      console.log('✅ user_profiles에서 소유자 프로필 로드 완료')
    } else {
      // user_profiles에서 찾지 못한 경우
      console.log('❌ user_profiles에서 프로필을 찾지 못함')
      
      // business_cards의 정보로 기본 프로필 생성
      cardOwner = {
        id: businessCard.user_id,
        email: businessCard.email || '',
        full_name: businessCard.full_name,
        company: businessCard.company || '',
        role: businessCard.role || '',
        contact: businessCard.contact || '',
        profile_image_url: businessCard.profile_image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role_id: 1,
        affiliation_type: '소속',
        has_business_card: true,
        // 나머지 필드는 기본값
        nickname: '',
        birth_date: null,
        affiliation: businessCard.company || '',
        introduction: businessCard.introduction || '',
        external_links: [],
        mbti: businessCard.mbti || '',
        keywords: businessCard.keywords || [],
        qr_code_url: businessCard.qr_code_url || null,
        personality_keywords: businessCard.personality_keywords || [],
        interest_keywords: businessCard.interest_keywords || [],
        work_field: businessCard.work_field || '',
        hobby_keywords: businessCard.hobby_keywords || [],
        job_title: businessCard.job_title || ''
      }
      console.log('📝 business_cards 정보로 기본 프로필 생성')
    }
    
    return {
      user: user, // null일 수 있음
      cardData: businessCard,
      cardOwner: cardOwner,
      isCollected,
      cardType: 'business_card'
    }
    
  } catch (error) {
    console.error('🚨 명함 데이터 가져오기 오류:', error)
    return {
      user: null,
      cardData: null,
      cardOwner: null,
      isCollected: false,
      cardType: 'none'
    }
  }
}

export async function getUserProfileData(profileId?: string): Promise<{
  user: UserProfile
  profile: UserProfile
  businessCards: UserBusinessCard[]
  isOwnProfile: boolean
}> {
  const user = await requireUserAuth()
  const targetUserId = profileId || user.id
  const isOwnProfile = targetUserId === user.id

  try {
    const supabase = await createClient()

    const [profileResult, businessCardsResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single(),

      supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
    ])

    if (profileResult.error || !profileResult.data) {
      throw new Error('프로필을 찾을 수 없습니다.')
    }

    return {
      user,
      profile: profileResult.data,
      businessCards: businessCardsResult.data || [],
      isOwnProfile
    }
  } catch (error) {
    console.error('프로필 데이터 가져오기 오류:', error)
    throw new Error('프로필 데이터를 불러올 수 없습니다.')
  }
}