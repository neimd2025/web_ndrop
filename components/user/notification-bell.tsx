"use client"

import { UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from "@/utils/supabase/client"
import { Bell, Calendar, Megaphone, Plus, RefreshCw, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface NotificationBellProps {
  user?: UserProfile
  initialNotifications?: UserNotification[]
}

export function NotificationBell({
  user: initialUser,
  initialNotifications
}: NotificationBellProps = {}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications || [])
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 알림 새로고침 함수
  const refreshNotifications = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 알림 새로고침을 건너뜁니다')
      return
    }

    try {
      const { data: allNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 알림 조회 오류:', error)
        return
      }

      // 사용자에게 보여줄 알림 필터링
      const userNotifications = allNotifications?.filter(notification => {
        if (notification.target_type === 'all') return true
        if (notification.target_type === 'specific') return notification.user_id === user.id
        if (notification.target_type === 'event_participants') return true
        return false
      }) || []

      setNotifications(userNotifications)
      
      // 읽지 않은 알림 개수 계산
      const unread = userNotifications.filter(notification => !notification.read_at).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('알림 새로고침 오류:', error)
    }
  }

  // 사용자 인증 상태 확인 및 초기 알림 로드
  useEffect(() => {
    const checkUserAndLoadNotifications = async () => {
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          setUser(currentUser as any)
        }
        return
      }
      await refreshNotifications()
    }

    checkUserAndLoadNotifications()
  }, [])

  // 사용자 정보가 변경될 때 알림 새로고침
  useEffect(() => {
    if (user) {
      refreshNotifications()
    }
  }, [user])

  // 실시간 알림 수신
  useEffect(() => {
    if (!user) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as UserNotification

          if (newNotification.target_type === 'all' ||
              (newNotification.target_type === 'specific' && newNotification.user_id === user.id)) {
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
            if (!isOpen) {
              toast.success('새 알림이 도착했습니다!')
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [user, isOpen])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 알림 읽음 처리 함수
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
    }
  }

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }

    setIsOpen(false)

    // 알림 타입에 따른 라우팅
    if (notification.target_event_id) {
      router.push(`/client/events/${notification.target_event_id}`)
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user) return

    try {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error)
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
  const getNotificationIcon = (notification: UserNotification) => {
    switch (notification.notification_type) {
      case 'business_card_collected':
        return { icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100' }
      case 'event_joined':
        return { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' }
      case 'event_created':
        return { icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'profile_updated':
        return { icon: User, color: 'text-green-600', bg: 'bg-green-100' }
      case 'system':
        return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' }
      case 'announcement':
      default:
        return { icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 말풍선 형태의 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-600">불러오는 중...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">아직 받은 알림이 없습니다.</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification)
                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 text-sm leading-tight">
                            {notification.title}
                          </h4>
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={refreshNotifications}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-purple-600 py-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}