import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  company?: string
  role?: string
  profile_image_url?: string
  created_at: string
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
  title: string
  email: string
  phone?: string
  website?: string
  bio?: string
  qr_code_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface UserNotification {
  id: string
  title: string
  message: string
  type: 'system' | 'event' | 'announcement'
  target_type?: 'all' | 'specific' | 'event_participants'
  target_ids?: string[]
  target_event_id?: string
  is_read: boolean
  created_at: string
  sent_date?: string
  delivered_count?: number
  read_count?: number
  status?: 'draft' | 'sent' | 'scheduled'
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

    const [eventsResult, participationsResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false }),

      supabase
        .from('event_participants')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
    ])

    return {
      user,
      events: eventsResult.data || [],
      userParticipations: participationsResult.data || []
    }
  } catch (error) {
    console.error('이벤트 데이터 가져오기 오류:', error)
    throw new Error('이벤트 데이터를 불러올 수 없습니다.')
  }
}

export async function getUserBusinessCardsData(): Promise<{
  user: UserProfile
  businessCards: UserBusinessCard[]
}> {
  const user = await requireUserAuth()

  try {
    const supabase = await createClient()

    const { data: businessCards, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('명함 데이터 가져오기 오류:', error)
      throw new Error('명함 데이터를 불러올 수 없습니다.')
    }

    return {
      user,
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

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_type.eq.all,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('알림 데이터 가져오기 오류:', error)
      throw new Error('알림 데이터를 불러올 수 없습니다.')
    }

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

    const [businessCardsResult, participationsResult] = await Promise.all([
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

    const stats = {
      totalEvents: participatedEvents.length,
      totalBusinessCards: businessCards.length,
      profileViews: businessCards.reduce((sum, card) => sum + (card.view_count || 0), 0)
    }

    return {
      user,
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