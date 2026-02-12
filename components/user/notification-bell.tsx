// @ts-nocheck
"use client"

import { UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { notificationAPI } from '@/lib/supabase/database'
import { createClient } from "@/utils/supabase/client"
import { Bell, Calendar, Check, Megaphone, Plus, RefreshCw, User, X, MessageSquare } from "lucide-react"
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
  
  // Sync user state with prop
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
    }
  }, [initialUser])

  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 읽지 않은 알림만 필터링 (Derived State)
  const unreadNotifications = allNotifications.filter(notification => !notification.read_at)
  const unreadCount = unreadNotifications.length

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
      const userNotifications = await notificationAPI.getUserNotifications(user.id, supabase)

      console.log('✅ API로 가져온 알림:', userNotifications)
      console.log('📊 전체 알림 개수:', userNotifications?.length || 0)

      setAllNotifications(userNotifications || [])
      
      // 읽지 않은 알림 개수 로깅
      const unread = (userNotifications || []).filter(n => !n.read_at).length
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
          console.log('🔔 [Realtime] Notification received:', payload);
          const newNotification = payload.new as UserNotification
          
          // RLS가 적용되어 있어도 클라이언트 필터링 유지 (안전장치)
          if (newNotification.target_type === 'all' ||
              (newNotification.target_type === 'specific' && newNotification.user_id === user.id)) {
            console.log('✅ [Realtime] Notification accepted for user:', user.id);
            // 새 알림 추가 (아직 읽지 않은 상태)
            setAllNotifications((prev) => [newNotification, ...prev])
            
            if (!isOpen) {
              // 알림 타입에 따라 다른 토스트 메시지 표시
              if (newNotification.notification_type === 'meeting_chat') {
                 toast.info('새로운 메시지가 도착했습니다', {
                   description: newNotification.message,
                   action: {
                     label: '보기',
                     onClick: () => handleNotificationClick(newNotification)
                   }
                 });
              } else if (newNotification.notification_type === 'meeting_request') {
                toast.success('새로운 미팅 요청이 있습니다', {
                   description: newNotification.message,
                   action: {
                     label: '확인',
                     onClick: () => handleNotificationClick(newNotification)
                   }
                });
              } else {
                toast.success(newNotification.title || '새 알림이 도착했습니다!');
              }
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
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Realtime] Subscription status for channel notifications:${user.id}:`, status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // 연결 성공 시 한 번만 표시 (옵션)
          // toast.success('실시간 알림 서버에 연결되었습니다.');
        } else {
          setIsConnected(false);
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [user]) // Removed isOpen from dependencies to prevent reconnection on toggle

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

    if (unreadNotifications.length === 0) {
      toast.info('읽지 않은 알림이 없습니다')
      return
    }

    try {
      setLoading(true)
      const countToMark = unreadNotifications.length
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
        
        console.log('✅ 모두 읽음 처리 완료')
        toast.success(`모든 알림(${countToMark}개)을 읽음으로 표시했습니다`)
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
        return { icon: Plus, color: 'text-blue-400', bg: 'bg-blue-500/20' }
      case 'event_joined':
        return { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20' }
      case 'event_created':
        return { icon: Megaphone, color: 'text-orange-400', bg: 'bg-orange-500/20' }
      case 'profile_updated':
        return { icon: User, color: 'text-green-400', bg: 'bg-green-500/20' }
      case 'meeting_chat':
        return { icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/20' }
      case 'system':
        return { icon: Bell, color: 'text-gray-400', bg: 'bg-gray-500/20' }
      case 'announcement':
      default:
        return { icon: Megaphone, color: 'text-orange-400', bg: 'bg-orange-500/20' }
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

    // 채팅 알림인 경우 바로 페이지 이동
    if (notification.notification_type === 'meeting_chat' && notification.metadata?.meeting_id) {
      const eventId = notification.related_event_id || notification.target_event_id;
      if (eventId) {
        router.push(`/client/events/${eventId}?tab=meetings&meetingId=${notification.metadata.meeting_id}&openChat=true`);
        return;
      }
    }

    // 미팅 요청 알림인 경우 바로 미팅 탭으로 이동
    if (notification.notification_type === 'meeting_request' && notification.metadata?.meeting_id) {
      const eventId = notification.related_event_id || notification.target_event_id;
      if (eventId) {
        router.push(`/client/events/${eventId}?tab=meetings&meetingId=${notification.metadata.meeting_id}`);
        return;
      }
    }
    
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
        className="relative p-2 text-gray-200 hover:text-purple-400 hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 말풍선 형태의 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/90 backdrop-blur-md rounded-lg shadow-2xl shadow-purple-500/10 border border-white/10 z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">알림</h3>
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
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 알림 목록 - 읽지 않은 알림만 표시 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                <span className="ml-2 text-sm text-gray-400">불러오는 중...</span>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">읽지 않은 알림이 없습니다.</p>
              </div>
            ) : (
              unreadNotifications.slice(0, 10).map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification)
                
                return (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors bg-slate-800/30"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-white text-sm leading-tight">
                            {notification.title}
                          </h4>
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0 animate-pulse"></div>
                        </div>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-slate-500 text-xs">
                            {formatTime(notification.created_at)}
                          </p>
                          <span className="text-xs text-blue-400">
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
            <div className="p-3 border-t border-white/10">
              <button
                onClick={refreshNotifications}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-purple-400 py-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              
              {allNotifications.length > unreadNotifications.length && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-500">
                    {allNotifications.length - unreadNotifications.length}개의 읽은 알림이 있습니다
                  </p>
                  <button
                    onClick={() => router.push('/client/notifications')}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-1"
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
