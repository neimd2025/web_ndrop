import { ROLE_IDS } from '@/lib/constants'
import { Database } from '@/types/supabase'
import { createClient } from '@/utils/supabase/client'

type Tables = Database['public']['Tables']
type UserProfile = Tables['user_profiles']['Row']
type UserProfileInsert = Tables['user_profiles']['Insert']
type UserProfileUpdate = Tables['user_profiles']['Update']

type Event = Tables['events']['Row']
type EventInsert = Tables['events']['Insert']
type EventUpdate = Tables['events']['Update']

type BusinessCard = Tables['business_cards']['Row']
type BusinessCardInsert = Tables['business_cards']['Insert']
type BusinessCardUpdate = Tables['business_cards']['Update']

type CollectedCard = Tables['collected_cards']['Row']
type CollectedCardInsert = Tables['collected_cards']['Insert']

type Notification = Tables['notifications']['Row']
type NotificationInsert = Tables['notifications']['Insert']

// 이벤트 상태 계산 함수 (DB 수정 없이)
export const calculateEventStatus = (event: any) => {
  const now = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  if (now < startDate) {
    return 'upcoming'
  } else if (now >= startDate && now < endDate) {
    return 'ongoing'
  } else {
    return 'completed'
  }
}

// 이벤트 상태별 필터링 함수
export const filterEventsByStatus = (events: any[], status: 'upcoming' | 'ongoing' | 'completed') => {
  return events.filter(event => calculateEventStatus(event) === status)
}

// 사용자 프로필 관련 함수들
export const userProfileAPI = {
  // 사용자 프로필 가져오기
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  },

  // 이메일 중복 검사
  async checkEmailExists(email: string): Promise<boolean> {
    const supabase = createClient()

    try {
      // 실제로는 회원가입 시도로 중복을 확인하는 것이 더 정확합니다
      // 여기서는 간단한 시뮬레이션을 위해 false 반환
      // 실제 구현에서는 서버 사이드에서 처리하거나
      // 회원가입 시도 후 에러 메시지로 판단하는 것이 좋습니다
      return false
    } catch (error) {
      console.error('이메일 중복 검사 오류:', error)
      return false
    }
  },

  // 사용자 프로필 생성
  async createUserProfile(profile: UserProfileInsert): Promise<UserProfile | null> {
    const supabase = createClient()

    // 기본 역할 초기화 (필요한 경우)
    await initializeDefaultRoles()

    // role_id가 null이거나 undefined인 경우 기본값 설정 (일반 사용자)
    const profileData = { ...profile }
    if (profileData.role_id === null || profileData.role_id === undefined) {
      console.log('새 프로필 생성 시 role_id가 null이므로 기본값 USER(1)로 설정')
      profileData.role_id = ROLE_IDS.USER
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return data
  },

  // 사용자 프로필 업데이트
  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    const supabase = createClient()

    // 기본 역할 초기화 (필요한 경우)
    await initializeDefaultRoles()

    console.log('프로필 업데이트 시작:', { userId, updates })

    // birth_date 필터링
    const cleanedUpdates = { ...updates }
    if (cleanedUpdates.birth_date) {
      const date = new Date(cleanedUpdates.birth_date)
      if (isNaN(date.getTime()) || cleanedUpdates.birth_date === '123123123') {
        console.log('잘못된 birth_date 값 제거:', cleanedUpdates.birth_date)
        delete cleanedUpdates.birth_date
      }
    }

    // personality_keywords 필드가 빈 배열인 경우 null로 설정
    if (cleanedUpdates.personality_keywords && Array.isArray(cleanedUpdates.personality_keywords) && cleanedUpdates.personality_keywords.length === 0) {
      console.log('빈 personality_keywords 배열을 null로 설정')
      cleanedUpdates.personality_keywords = null
    }

    // interest_keywords 필드가 빈 배열인 경우 null로 설정
    if (cleanedUpdates.interest_keywords && Array.isArray(cleanedUpdates.interest_keywords) && cleanedUpdates.interest_keywords.length === 0) {
      console.log('빈 interest_keywords 배열을 null로 설정')
      cleanedUpdates.interest_keywords = null
    }

    // 기존 keywords 필드 처리 (하위 호환성)
    if (cleanedUpdates.keywords && Array.isArray(cleanedUpdates.keywords) && cleanedUpdates.keywords.length === 0) {
      console.log('빈 keywords 배열을 null로 설정')
      cleanedUpdates.keywords = null
    }

    // 빈 문자열 필드들을 null로 설정
    const fieldsToNullify = ['affiliation', 'role', 'work_field', 'contact', 'introduction', 'mbti', 'external_link']
    fieldsToNullify.forEach(field => {
      if (cleanedUpdates[field as keyof typeof cleanedUpdates] === '') {
        console.log(`${field} 빈 문자열을 null로 설정`)
        ;(cleanedUpdates as any)[field] = null
      }
    })

    // role_id가 null이거나 undefined인 경우 기본값 설정 (일반 사용자)
    if (cleanedUpdates.role_id === null || cleanedUpdates.role_id === undefined) {
      console.log('role_id가 null이므로 기본값 USER(1)로 설정')
      cleanedUpdates.role_id = ROLE_IDS.USER
    }

    console.log('정리된 업데이트 데이터:', cleanedUpdates)

    const { data, error } = await supabase
      .from('user_profiles')
      .update(cleanedUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log('프로필 업데이트 성공:', data)
    return data
  },

  // 사용자 프로필 삭제
  async deleteUserProfile(userId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user profile:', error)
      return false
    }

    return true
  }
}

// 이벤트 관련 함수들
export const eventAPI = {
  // 모든 이벤트 가져오기
  async getAllEvents(): Promise<Event[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    return data || []
  },



  // 특정 이벤트 가져오기
  async getEvent(eventId: string): Promise<Event | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      return null
    }

    return data
  },

  // 이벤트 코드로 이벤트 찾기
  async getEventByCode(eventCode: string): Promise<Event | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_code', eventCode)
      .single()

    if (error) {
      console.error('Error fetching event by code:', error)
      return null
    }

    return data
  },

  // 이벤트 생성
  async createEvent(event: EventInsert): Promise<Event | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return null
    }

    return data
  },

  // 이벤트 업데이트
  async updateEvent(eventId: string, updates: EventUpdate): Promise<Event | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return null
    }

    return data
  },

  // 이벤트 삭제
  async deleteEvent(eventId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return false
    }

    return true
  }
}

// 명함 관련 함수들
export const businessCardAPI = {
  // 사용자 비즈니스 카드 가져오기
  async getUserBusinessCard(userId: string): Promise<BusinessCard | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching business card:', error)

      // 여러 행이 있는 경우 중복 정리
      if (error.code === 'PGRST116' && error.details?.includes('5 rows')) {
        console.log('🔄 중복 비즈니스 카드 발견, 정리 중...')
        await this.cleanupDuplicateBusinessCards(userId)

        // 정리 후 다시 시도
        const { data: retryData, error: retryError } = await supabase
          .from('business_cards')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single()

        if (!retryError && retryData) {
          return retryData
        }
      }

      return null
    }

    return data
  },

  // 공개 명함 가져오기
  async getPublicBusinessCard(cardId: string): Promise<BusinessCard | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', cardId)
      .eq('is_public', true)
      .single()

    if (error) {
      console.error('Error fetching public business card:', error)
      return null
    }

    return data
  },

  // 명함 생성
  async createBusinessCard(card: BusinessCardInsert): Promise<BusinessCard | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('business_cards')
      .insert(card)
      .select()
      .single()

    if (error) {
      console.error('Error creating business card:', error)
      return null
    }

    return data
  },

  // 명함 업데이트
  async updateBusinessCard(cardId: string, updates: BusinessCardUpdate): Promise<BusinessCard | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('business_cards')
      .update(updates)
      .eq('id', cardId)
      .select()
      .single()

    if (error) {
      console.error('Error updating business card:', error)
      return null
    }

    return data
  },

  // 명함 삭제
  async deleteBusinessCard(cardId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('business_cards')
      .delete()
      .eq('id', cardId)

    if (error) {
      console.error('Error deleting business card:', error)
      return false
    }

    return true
  },

  // 중복 비즈니스 카드 정리
  async cleanupDuplicateBusinessCards(userId: string): Promise<void> {
    const supabase = createClient()

    // 사용자의 모든 비즈니스 카드 가져오기
    const { data: cards, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching business cards for cleanup:', error)
      return
    }

    // 첫 번째 카드만 남기고 나머지 삭제
    if (cards && cards.length > 1) {
      const cardsToDelete = cards.slice(1)
      const cardIds = cardsToDelete.map(card => card.id)

      const { error: deleteError } = await supabase
        .from('business_cards')
        .delete()
        .in('id', cardIds)

      if (deleteError) {
        console.error('Error deleting duplicate business cards:', deleteError)
      } else {
        console.log(`✅ ${cardsToDelete.length}개의 중복 비즈니스 카드를 정리했습니다.`)
      }
    }
  }
}

// 이벤트 참가자 관련 함수들
export const eventParticipantAPI = {
  // 이벤트 참가자 목록 가져오기
  async getEventParticipants(eventId: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching event participants:', error)
      return []
    }

    return data || []
  },

  // 사용자의 이벤트 참가 여부 확인
  async getUserParticipation(eventId: string, userId: string): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user participation:', error)
      return null
    }

    return data
  },

  // 이벤트 참가 (알림 생성 포함)
  async joinEvent(eventId: string, userId: string): Promise<any | null> {
    try {
      // API를 통해 참가 (알림 생성 포함)
      const response = await fetch('/api/user/join-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          userId: userId
        })
      })

      const result = await response.json()

      if (result.success) {
        return result.participant
      } else {
        console.error('Error joining event:', result.error)
        return null
      }
    } catch (error) {
      console.error('Error joining event:', error)
      return null
    }
  },

  // 이벤트 참가 취소
  async leaveEvent(eventId: string, userId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error leaving event:', error)
      return false
    }

    return true
  },

  // 참가 상태 업데이트
  async updateParticipationStatus(participationId: string, status: string): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_participants')
      .update({ status })
      .eq('id', participationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating participation status:', error)
      return null
    }

    return data
  }
}

// 수집된 명함 관련 함수들
export const collectedCardAPI = {
  // 사용자가 수집한 명함 목록 가져오기
  async getUserCollectedCards(userId: string): Promise<CollectedCard[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('collected_cards')
      .select(`
        *,
        business_cards (*)
      `)
      .eq('collector_id', userId)
      .not('business_cards.user_id', 'eq', userId)
      .order('collected_at', { ascending: false })

    if (error) {
      console.error('Error fetching collected cards:', error)
      return []
    }

    return data || []
  },

  // 명함 수집
  async collectCard(collection: CollectedCardInsert): Promise<CollectedCard | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('collected_cards')
      .insert(collection)
      .select()
      .single()

    if (error) {
      console.error('Error collecting card:', error)
      return null
    }

    return data
  },

  // 즐겨찾기 토글
  async toggleFavorite(collectionId: string, isFavorite: boolean): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('collected_cards')
      .update({ is_favorite: isFavorite })
      .eq('id', collectionId)

    if (error) {
      console.error('Error toggling favorite:', error)
      return false
    }

    return true
  },

  // 수집된 명함 삭제
  async removeCollectedCard(collectionId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('collected_cards')
      .delete()
      .eq('id', collectionId)

    if (error) {
      console.error('Error removing collected card:', error)
      return false
    }

    return true
  },

  // 메모 업데이트
  async updateMemo(collectionId: string, memo: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('collected_cards')
      .update({ memo: memo })
      .eq('id', collectionId)

    if (error) {
      console.error('Error updating memo:', error)
      return false
    }

    return true
  }
}

// 알림 관련 함수들
export const notificationAPI = {
  // 사용자 알림 가져오기
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const supabase = createClient()

    // 모든 알림을 가져와서 필터링
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    // 사용자에게 보여줄 알림 필터링
    const notifications = allNotifications?.filter(notification => {
      // 전체 대상 알림이거나
      if (notification.target_type === 'all') {
        return true
      }

      // 특정 사용자 대상 알림인 경우 (실제 스키마에 맞춤)
      if (notification.target_type === 'specific') {
        return notification.user_id === userId
      }

      // event_participants 타입도 확인 (관리자 공지용)
      if (notification.target_type === 'event_participants') {
        return true
      }

      return false
    }) || []

    return notifications
  },

  // 모든 알림 가져오기 (관리자용)
  async getAllNotifications(): Promise<Notification[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all notifications:', error)
      return []
    }

    return data || []
  },

  // 특정 알림 가져오기
  async getNotification(notificationId: string): Promise<Notification | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error) {
      console.error('Error fetching notification:', error)
      return null
    }

    return data
  },

  // 알림 생성
  async createNotification(notification: NotificationInsert): Promise<Notification | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  },

  // 알림 업데이트
  async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<Notification | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return null
    }

    return data
  },

  // 알림 삭제
  async deleteNotification(notificationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      return false
    }

    return true
  },

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const supabase = createClient()

    // 먼저 현재 읽음 카운트를 가져옵니다
    const { data: currentNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('read_count')
      .eq('id', notificationId)
      .single()

    if (fetchError) {
      console.error('Error fetching notification:', fetchError)
      return false
    }

    // 읽음 카운트를 1 증가시킵니다
    const { error } = await supabase
      .from('notifications')
      .update({ read_count: (currentNotification?.read_count || 0) + 1 })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }
}

// 피드백 관련 함수들
export const feedbackAPI = {
  // 이벤트 피드백 가져오기
  async getEventFeedback(eventId: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching event feedback:', error)
      return []
    }

    return data || []
  },

  // 사용자 피드백 가져오기
  async getUserFeedback(userId: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user feedback:', error)
      return []
    }

    return data || []
  },

  // 특정 피드백 가져오기
  async getFeedback(feedbackId: string): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single()

    if (error) {
      console.error('Error fetching feedback:', error)
      return null
    }

    return data
  },

  // 피드백 생성
  async createFeedback(feedback: any): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback)
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback:', error)
      return null
    }

    return data
  },

  // 피드백 업데이트
  async updateFeedback(feedbackId: string, updates: any): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', feedbackId)
      .select()
      .single()

    if (error) {
      console.error('Error updating feedback:', error)
      return null
    }

    return data
  },

  // 피드백 삭제
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId)

    if (error) {
      console.error('Error deleting feedback:', error)
      return false
    }

    return true
  }
}

// 기본 역할 초기화 함수
export const initializeDefaultRoles = async () => {
  const supabase = createClient()

  try {
    // 기존 역할 확인
    const { data: existingRoles, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true })

    if (fetchError) {
      console.error('기존 역할 조회 오류:', fetchError)
      return false
    }

    // 기본 역할이 없는 경우 생성
    if (!existingRoles || existingRoles.length === 0) {
      console.log('기본 역할 데이터가 없습니다. 생성 중...')

      const defaultRoles = [
        { id: ROLE_IDS.USER, name: 'user', description: '일반 사용자' },
        { id: ROLE_IDS.ADMIN, name: 'admin', description: '시스템 관리자' }
      ]

      const { error: insertError } = await supabase
        .from('roles')
        .insert(defaultRoles)

      if (insertError) {
        console.error('기본 역할 생성 오류:', insertError)
        return false
      }

      console.log('✅ 기본 역할이 성공적으로 생성되었습니다.')
      return true
    } else {
      console.log('기본 역할이 이미 존재합니다.')
      return true
    }
  } catch (error) {
    console.error('역할 초기화 중 오류:', error)
    return false
  }
}

// 역할 관련 함수들
export const roleAPI = {
  // 모든 역할 가져오기
  async getAllRoles(): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return []
    }

    return data || []
  },

  // 특정 역할 가져오기
  async getRole(roleId: number): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error) {
      console.error('Error fetching role:', error)
      return null
    }

    return data
  },

  // 역할 생성
  async createRole(role: any): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      return null
    }

    return data
  },

  // 역할 업데이트
  async updateRole(roleId: number, updates: any): Promise<any | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      return null
    }

    return data
  },

  // 역할 삭제
  async deleteRole(roleId: number): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)

    if (error) {
      console.error('Error deleting role:', error)
      return false
    }

    return true
  }
}
