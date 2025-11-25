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
  notification_type: 'announcement' | 'business_card_collected' | 'event_joined' | 'event_created' | 'profile_updated' | 'system'
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

export async function getUserAuth(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // 프로필이 없는 경우도 정상적인 상황으로 처리
      if (profileError.code === 'PGRST116') {
        return {
          id: user.id,
          email: user.email!,
          created_at: user.created_at
        } as UserProfile
      }
      console.error('프로필 가져오기 오류:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('사용자 인증 확인 오류:', error)
    return null
  }
}

export async function requireUserAuth(): Promise<UserProfile> {
  const user = await getUserAuth()

  if (!user) {
    redirect('/login?type=user')
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
    throw new Error('마이페이지 데이터를 불러올 수 없습니다.')
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
}> {
  try {
    const supabase = await createClient()

    // 1. 먼저 collected_cards에서 해당 id의 card_id를 찾습니다
    const { data: collectedCard, error: collectedError } = await supabase
      .from('collected_cards')
      .select('card_id')
      .eq('id', id)
      .single()

    if (collectedError) {
      console.error('수집된 명함 ID 찾기 오류:', collectedError)
      throw new Error('수집된 명함을 찾을 수 없습니다.')
    }

    // 2. 찾은 card_id로 실제 명함 정보를 가져옵니다
    const { data: savedCards, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', collectedCard.card_id)

    if (error) {
      console.error('명함 데이터 가져오기 오류:', error)
      throw new Error('명함 데이터를 불러올 수 없습니다.')
    }

    return {
      savedCards: savedCards || []
    }
  } catch (error) {
    console.error('저장된 명함 데이터 가져오기 오류:', error)
    throw new Error('저장된 명함 데이터를 불러올 수 없습니다.')
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