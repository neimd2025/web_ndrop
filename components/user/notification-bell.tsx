// @ts-nocheck
"use client"

import { UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { notificationAPI } from '@/lib/supabase/database'
import { createClient } from "@/utils/supabase/client"
import { Bell, Calendar, Check, Megaphone, Plus, RefreshCw, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { NotificationModal } from '@/components/user/notification-modal'

interface NotificationBellProps {
  user?: UserProfile
  initialNotifications?: UserNotification[]
}

export function NotificationBell({
  user: initialUser,
  initialNotifications
}: NotificationBellProps = {}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [allNotifications, setAllNotifications] = useState<UserNotification[]>(initialNotifications || [])
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 읽지 않은 알림만 필터링
  const unreadNotifications = allNotifications.filter(notification => !notification.read_at)

  // 알림 새로고침 함수 - API 사용
  const refreshNotifications = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 알림 새로고침을 건너뜁니다')
      return
    }

    try {
      setLoading(true)
      console.log('🔄 알림 새로고침 시작, 사용자 ID:', user.id)

      // API를 사용하여 알림 가져오기
      const userNotifications = await notificationAPI.getUserNotifications(user.id)

      console.log('✅ API로 가져온 알림:', userNotifications)
      console.log('📊 전체 알림 개수:', userNotifications?.length || 0)

      setAllNotifications(userNotifications || [])
      
      // 읽지 않은 알림 개수 계산 (read_at이 null인 것만)
      const unread = userNotifications.filter(notification => !notification.read_at).length
      setUnreadCount(unread)
      console.log('📊 읽지 않은 알림 개수:', unread)
    } catch (error) {
      console.error('알림 새로고침 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 인증 상태 확인 및 초기 알림 로드
  useEffect(() => {
    const checkUserAndLoadNotifications = async () => {
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          console.log('인증된 사용자 발견:', currentUser.id)
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
            // 새 알림 추가 (아직 읽지 않은 상태)
            setAllNotifications((prev) => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
            if (!isOpen) {
              toast.success('새 알림이 도착했습니다!')
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as UserNotification
          
          // 알림 목록 업데이트
          setAllNotifications(prev =>
            prev.map(notification =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          )
          
          // 읽지 않은 알림 개수 재계산
          const currentUnreadCount = allNotifications.filter(n => !n.read_at).length
          setUnreadCount(currentUnreadCount)
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

  // 알림 읽음 처리 함수 - API 사용
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      console.log('📝 알림 읽음 처리 시작:', notificationId)
      
      // 1. API 호출로 서버에 read_at 업데이트
      const success = await notificationAPI.markNotificationAsRead(notificationId, user.id)
      
      if (success) {
        // 2. 성공하면 로컬 상태 업데이트
        setAllNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { 
                  ...notification, 
                  read_at: new Date().toISOString()
                }
              : notification
          )
        )
        
        // 읽지 않은 알림 개수 감소
        setUnreadCount(prev => Math.max(0, prev - 1))
        
        console.log('✅ 알림 읽음 처리 완료:', notificationId)
      } else {
        console.error('❌ 알림 읽음 처리 실패')
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
    }
  }

  // 모든 알림 읽음 처리 - API 사용
  const markAllAsRead = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    if (unreadCount === 0) {
      toast.info('읽지 않은 알림이 없습니다')
      return
    }

    try {
      setLoading(true)
      console.log('📝 모두 읽음 처리 시작, 사용자 ID:', user.id)
      
      // 1. API 호출로 모든 알림 read_at 업데이트
      const success = await notificationAPI.markAllNotificationsAsRead(user.id)
      
      if (success) {
        // 2. 성공하면 로컬 상태 업데이트
        setAllNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            read_at: notification.read_at || new Date().toISOString()
          }))
        )
        
        // 읽지 않은 알림 개수 0으로 설정
        setUnreadCount(0)
        
        console.log('✅ 모두 읽음 처리 완료')
        toast.success(`모든 알림(${unreadCount}개)을 읽음으로 표시했습니다`)
      } else {
        console.error('❌ 모두 읽음 처리 실패')
        toast.error('모두 읽음 처리에 실패했습니다')
      }
    } catch (error) {
      console.error('모두 읽음 처리 오류:', error)
      toast.error('모두 읽음 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
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

  const [selectedNotification, setSelectedNotification] = useState<UserNotification | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 알림 클릭 처리 함수 수정
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!user) return

    console.log('🔔 알림 클릭:', notification.id, '읽음 상태:', notification.read_at)
    
    // 이미 읽은 알림인지 확인
    const isRead = notification.read_at !== null
    
    if (!isRead) {
      console.log('📝 읽지 않은 알림, 읽음 처리 시작')
      await markAsRead(notification.id)
    } else {
      console.log('📌 이미 읽은 알림')
    }

    setIsOpen(false)
    
    // 모달에 알림 정보 설정하고 열기
    setSelectedNotification(notification)
    setIsModalOpen(true)
  }

  // 모달 닫기 함수
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedNotification(null)
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">알림</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      처리중
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      모두 읽음
                    </>
                  )}
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

          {/* 알림 목록 - 읽지 않은 알림만 표시 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-600">불러오는 중...</span>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">읽지 않은 알림이 없습니다.</p>
              </div>
            ) : (
              unreadNotifications.slice(0, 10).map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification)
                
                return (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50"
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
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0 animate-pulse"></div>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-gray-400 text-xs">
                            {formatTime(notification.created_at)}
                          </p>
                          <span className="text-xs text-blue-600">
                            읽지 않음
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 푸터 */}
          {unreadNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={refreshNotifications}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-purple-600 py-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              
              {allNotifications.length > unreadNotifications.length && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    {allNotifications.length - unreadNotifications.length}개의 읽은 알림이 있습니다
                  </p>
                  <button
                    onClick={() => router.push('/client/notifications')}
                    className="text-xs text-purple-600 hover:text-purple-700 mt-1"
                  >
                    모든 알림 보기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <NotificationModal 
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}
