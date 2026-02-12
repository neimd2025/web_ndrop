// @ts-nocheck
"use client"

import MobileHeader from "@/components/mobile-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { notificationAPI } from "@/lib/supabase/database"
import { createClient } from "@/utils/supabase/client"
import { Bell, Calendar, Check, Megaphone, Plus, RefreshCw, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
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

  // 안읽은 알림 개수 계산
  const unreadCount = notifications.filter(n => !n.read_at).length

  // 알림 새로고침 함수
  const refreshNotifications = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 알림 새로고침을 건너뜁니다')
      return
    }

    try {
      console.log('🔄 알림 새로고침 시작, 사용자 ID:', user.id)

      // 먼저 모든 알림을 가져와서 디버깅해보자
      console.log('🔍 모든 알림 데이터 조회 시작...')

      const { data: allNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 알림 조회 오류:', error)
        toast.error('알림을 불러오는데 실패했습니다')
        return
      }

      console.log('📋 데이터베이스의 모든 알림:', allNotifications)
      console.log('📊 전체 알림 개수:', allNotifications?.length || 0)
      console.log('👤 현재 사용자 ID:', user.id)

      // 사용자에게 보여줄 알림 필터링
      const userNotifications = allNotifications?.filter(notification => {
        // 전체 대상 알림이거나
        if (notification.target_type === 'all') {
          console.log(`✅ 전체 알림 포함: ${notification.title}`)
          return true
        }

        // 특정 사용자 대상 알림인 경우 (실제 스키마에 맞춤)
        if (notification.target_type === 'specific') {
          const isForUser = notification.user_id === user.id

          console.log(`🔍 특정 알림 체크: ${notification.title}`, {
            notification_user_id: notification.user_id,
            current_user_id: user.id,
            isForUser
          })

          return isForUser
        }

        // event_participants 타입도 확인 (관리자 공지용)
        if (notification.target_type === 'event_participants') {
          console.log(`🎯 이벤트 참가자 알림: ${notification.title}`)
          return true
        }

        return false
      }) || []

      console.log('✅ 최종 필터링된 알림:', userNotifications)
      console.log('📊 사용자에게 보여줄 알림 개수:', userNotifications.length)

      const data = userNotifications

      console.log('📋 새로고침된 알림 데이터:', data)
      console.log('📊 알림 개수:', data?.length || 0)

      // 각 알림의 상세 정보 로그
      data?.forEach((notification, index) => {
        console.log(`알림 ${index + 1}:`, {
          title: notification.title,
          message: notification.message,
          target_type: notification.target_type,
          target_ids: notification.target_ids,
          created_at: notification.created_at
        })
      })

      setNotifications(data || [])
    } catch (error) {
      console.error('알림 새로고침 오류:', error)
      toast.error('알림 새로고침에 실패했습니다')
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

  // 단일 알림 읽음 처리 함수
  const markAsRead = async (notificationId: string) => {
    console.log("씨발");
    if (!user) return

    try {
      // 1. API 호출로 서버에 읽음 상태 저장
      const success = await notificationAPI.markNotificationAsRead(notificationId, user.id)
      
      if (success) {
        // 2. 성공하면 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { 
                  ...notification, 
                  read_at: new Date().toISOString(),
                  read_by_users: [...(notification.read_by_users || []), user.id]
                }
              : notification
          )
        )
        console.log('✅ 알림 읽음 처리 완료:', notificationId)
        toast.success('알림을 읽음으로 표시했습니다')
      } else {
        console.error('❌ 알림 읽음 처리 실패')
        toast.error('알림 읽음 처리에 실패했습니다')
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
      toast.error('알림 읽음 처리 중 오류가 발생했습니다')
    }
  }

  // 모두 읽음 처리 함수
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
      
      // 1. API 호출로 모든 알림 읽음 처리
      const success = await notificationAPI.markAllNotificationsAsRead(user.id)
      
      if (success) {
        // 2. 성공하면 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            read_at: new Date().toISOString(),
            read_by_users: [...(notification.read_by_users || []), user.id]
          }))
        )
        
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

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!user) return

    console.log('🔔 알림 클릭:', notification.id, '읽음 상태:', notification.read_at)
    
    // 이미 읽은 알림인지 확인 (read_by_users도 확인)
    const isRead = notification.read_at || 
                   (notification.read_by_users && notification.read_by_users.includes(user.id))
    
    if (!isRead) {
      console.log('📝 읽지 않은 알림, 읽음 처리 시작')
      await markAsRead(notification.id)
    } else {
      console.log('📌 이미 읽은 알림')
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
      case 'system':
        return { icon: Bell, color: 'text-gray-400', bg: 'bg-gray-500/20' }
      case 'announcement':
      default:
        return { icon: Megaphone, color: 'text-orange-400', bg: 'bg-orange-500/20' }
    }
  }

  // 알림 타입에 따른 배지 텍스트
  const getNotificationBadgeText = (notification: UserNotification) => {
    switch (notification.notification_type) {
      case 'business_card_collected':
        return '활동'
      case 'event_joined':
        return '활동'
      case 'event_created':
        return '공지'
      case 'profile_updated':
        return '업데이트'
      case 'system':
        return '시스템'
      case 'announcement':
      default:
        return '공지'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative text-white overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-0 left-[10%] w-[1px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[120px] bg-gradient-to-b from-transparent via-blue-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "8s" }}></div>
      </div>

      <div className="relative z-10">
        <MobileHeader title="최근 활동 및 알림" />

        {/* 액션 버튼들 */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/10 backdrop-blur-sm bg-slate-950/50">
          <button
            onClick={refreshNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs text-slate-500">
                {unreadCount}개 읽지 않음
              </span>
            )}
            
            <Button
              onClick={markAllAsRead}
              disabled={loading || unreadCount === 0}
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs border-white/20 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Check className="h-3 w-3" />
              모두 읽음
            </Button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-slate-400">알림을 불러오는 중입니다...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500">아직 받은 알림이 없습니다.</p>
              <p className="text-sm text-slate-600 mt-1">새로운 알림이 오면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <>
              {/* 알림 목록 */}
              {notifications.map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification)
                const badgeText = getNotificationBadgeText(notification)
                const isRead = notification.read_at || 
                             (notification.read_by_users && notification.read_by_users.includes(user?.id || ''))

                return (
                  <Card
                    key={notification.id}
                    className={`border border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer backdrop-blur-sm ${
                      isRead ? 'bg-slate-900/50 opacity-60' : 'bg-slate-800/80 shadow-lg shadow-purple-900/10'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0 ${
                            isRead ? 'opacity-50' : ''
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${
                              isRead ? 'text-slate-400' : 'text-white'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  notification.notification_type === "business_card_collected" || notification.notification_type === "event_joined"
                                    ? "bg-white/10 text-slate-300"
                                    : "bg-purple-500/20 text-purple-300"
                                } ${isRead ? 'opacity-50' : ''}`}
                              >
                                {badgeText}
                              </Badge>
                              {!isRead && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            isRead ? 'text-slate-500' : 'text-slate-300'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                              {formatTime(notification.created_at)}
                            </p>
                            {isRead && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                읽음
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
