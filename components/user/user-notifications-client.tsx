"use client"

import MobileHeader from "@/components/mobile-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from "@/utils/supabase/client"
import { Calendar, Megaphone, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface UserNotificationsClientProps {
  user?: UserProfile
  initialNotifications?: UserNotification[]
}

export function UserNotificationsClient({
  user: initialUser,
  initialNotifications
}: UserNotificationsClientProps = {}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications || [])
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const router = useRouter()

  // 알림 새로고침 함수
  const refreshNotifications = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 알림 새로고침을 건너뜁니다')
      return
    }

    try {
      console.log('알림 새로고침 시작, 사용자 ID:', user.id)

      // 사용자에게 전송된 알림들을 가져옴 (실제 스키마에 맞춤)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`target_type.eq.all,user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('알림 새로고침 오류:', error)
        return
      }

      console.log('새로고침된 알림 데이터:', data)
      console.log('알림 개수:', data?.length || 0)
      setNotifications(data || [])
    } catch (error) {
      console.error('알림 새로고침 오류:', error)
    }
  }

  // 사용자 인증 상태 확인 및 초기 알림 로드
  useEffect(() => {
    const checkUserAndLoadNotifications = async () => {
      if (!user) {
        console.log('사용자 정보가 없습니다. 인증 상태를 확인합니다.')
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          console.log('인증된 사용자 발견:', currentUser.id)
          setUser(currentUser as any)
        } else {
          console.log('인증된 사용자가 없습니다.')
        }
        return
      }

      console.log('사용자 정보 확인됨, 알림 로드 시작:', user.id)
      await refreshNotifications()
    }

    checkUserAndLoadNotifications()
  }, [])

  // 사용자 정보가 변경될 때 알림 새로고침
  useEffect(() => {
    if (user) {
      console.log('사용자 정보 변경됨, 알림 새로고침:', user.id)
      refreshNotifications()
    }
  }, [user])

  // 페이지 포커스 시 알림 새로고침
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스됨, 알림 새로고침')
      refreshNotifications()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // 실시간 알림 수신을 위한 useEffect
  useEffect(() => {
    if (!user) return

    console.log('실시간 알림 구독 시작, 사용자 ID:', user.id)

    // 기존 채널이 있다면 정리
    if (channelRef.current) {
      console.log('기존 채널 정리')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // 새로운 채널 생성
    const channel = supabase.channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('새 알림 실시간 수신:', payload.new)
          const newNotification = payload.new as UserNotification

          // 현재 사용자에게 온 알림인지 확인
          if (newNotification.target_type === 'all' ||
              (newNotification.target_type === 'specific' && newNotification.user_id === user.id)) {
            console.log('사용자에게 맞는 알림 확인됨:', newNotification)
            setNotifications((prev) => [newNotification, ...prev])
            toast.success('새 알림이 도착했습니다!')
          }
        }
      )
      .subscribe((status) => {
        console.log('실시간 구독 상태:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      console.log('실시간 알림 구독 해제')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [user])

  // 알림 읽음 처리 함수
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      // 클라이언트에서 읽음 처리는 로컬 상태만 업데이트
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
    }
  }

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }

    // 알림 타입에 따른 라우팅
    switch (notification.target_type) {
      case 'all':
        // 전체 알림은 별도 처리 없음
        break
      case 'specific':
        if (notification.target_event_id) {
          router.push(`/client/events/${notification.target_event_id}`)
        }
        break
      case 'event_participants':
        if (notification.target_event_id) {
          router.push(`/client/events/${notification.target_event_id}`)
        }
        break
      default:
        break
    }
  }

  // 시간 포맷팅 함수
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 48) return '1일 전'
    return `${Math.floor(diffInHours / 24)}일 전`
  }

  // 아이콘과 색상 매핑
  const getNotificationIcon = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return { icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'specific':
        return { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' }
      case 'event_participants':
        return { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' }
      default:
        return { icon: Plus, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <MobileHeader title="최근 활동 및 알림" showMenuButton />

      {/* 새로고침 버튼 */}
      <div className="px-4 py-2">
        <button
          onClick={refreshNotifications}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">알림을 불러오는 중입니다...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">아직 받은 알림이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">새로운 알림이 오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const { icon, color, bg } = getNotificationIcon(notification.target_type)
            return (
              <Card
                key={notification.id}
                className="border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      {React.createElement(icon, { className: `h-5 w-5 ${color}` })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              notification.target_type === "specific"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {notification.target_type === "all" ? "전체 공지" :
                             notification.target_type === "specific" ? "개별 알림" :
                             notification.target_type === "event_participants" ? "이벤트 공지" : "알림"}
                          </Badge>
                          {!notification.read_at && <div className="w-2 h-2 bg-purple-600 rounded-full"></div>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatTime(notification.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
