import { createClient } from '@/utils/supabase/client'

export interface CreateNotificationParams {
  title: string
  message: string
  notification_type: 'announcement' | 'business_card_collected' | 'event_joined' | 'event_created' | 'profile_updated' | 'system'
  target_user_id?: string
  related_event_id?: string
}

export class NotificationService {
  private supabase = createClient()

  async createNotification(params: CreateNotificationParams) {
    try {
      const response = await fetch('/api/user/create-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '알림 생성에 실패했습니다.')
      }

      return result.notification
    } catch (error) {
      console.error('알림 생성 오류:', error)
      throw error
    }
  }

  // 명함 수집 알림
  async createBusinessCardCollectedNotification(
    collectorId: string,
    businessCardOwnerId: string,
    businessCardId: string,
    ownerName: string
  ) {
    return this.createNotification({
      title: '명함 수집',
      message: `${ownerName}님의 명함을 수집했습니다`,
      notification_type: 'business_card_collected',
      target_user_id: collectorId
    })
  }

  // 이벤트 참가 알림
  async createEventJoinedNotification(
    userId: string,
    eventId: string,
    eventTitle: string
  ) {
    return this.createNotification({
      title: '이벤트 참가',
      message: `${eventTitle}에 참가했습니다`,
      notification_type: 'event_joined',
      target_user_id: userId,
      related_event_id: eventId
    })
  }

  // 새로운 이벤트 생성 알림
  async createEventCreatedNotification(
    userId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string
  ) {
    return this.createNotification({
      title: '새로운 네트워킹 이벤트',
      message: `${eventTitle}이 ${eventDate}에 열립니다. 지금 참가신청하세요!`,
      notification_type: 'event_created',
      target_user_id: userId,
      related_event_id: eventId
    })
  }

  // 프로필 업데이트 알림
  async createProfileUpdatedNotification(
    userId: string,
    updateType: string
  ) {
    return this.createNotification({
      title: '프로필 업데이트',
      message: `${updateType}이 업데이트되었습니다`,
      notification_type: 'profile_updated',
      target_user_id: userId
    })
  }

  // 시스템 알림
  async createSystemNotification(
    userId: string,
    title: string,
    message: string
  ) {
    return this.createNotification({
      title,
      message,
      notification_type: 'system',
      target_user_id: userId
    })
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService()
