"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { businessCardAPI, collectedCardAPI } from '@/lib/supabase/database'
import { UserEvent, UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { Calendar, Camera, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserHomeClientProps {
  user?: UserProfile
  upcomingEvents?: UserEvent[]
  recentNotifications?: UserNotification[]
  businessCardStats?: {
    totalViews: number
    totalShares: number
    publicCards: number
  }
}

export function UserHomeClient({
  user: initialUser,
  upcomingEvents: initialEvents,
  recentNotifications: initialNotifications,
  businessCardStats: initialStats
}: UserHomeClientProps = {}) {
  const { profile } = useUserProfile()
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [events, setEvents] = useState<UserEvent[]>(initialEvents || [])
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications || [])
  const [businessCardStats, setBusinessCardStats] = useState(initialStats || { totalViews: 0, totalShares: 0, publicCards: 0 })
  const [userCard, setUserCard] = useState<any>(null)
  const [collectedCards, setCollectedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(!initialUser)
  const [activeTab, setActiveTab] = useState<'진행중' | '예정' | '종료'>('진행중')

  const { profile: authUser } = useAuth('user')

  // 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialUser && authUser) {
        setLoading(true)
        try {
          setUser(authUser as any)
          // 사용자 정보가 로드된 후 다른 데이터들 로드
          await loadUserCard()
        } catch (error) {
          console.error('초기 데이터 로딩 실패:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadInitialData()
  }, [initialUser, authUser])

  // 데이터 로딩 함수들
  const loadUserCard = async () => {
    if (!user?.id) return
    try {
      const cardData = await businessCardAPI.getUserBusinessCard(user.id)
      setUserCard(cardData)
    } catch (error) {
      console.error('Error loading user card:', error)
    }
  }

  const loadCollectedCards = async () => {
    if (!user?.id) return
    try {
      const cardsData = await collectedCardAPI.getUserCollectedCards(user.id)
      setCollectedCards(cardsData)
    } catch (error) {
      console.error('Error loading collected cards:', error)
    }
  }

  const loadEvents = async () => {
    if (!user?.id) return

    try {
      // 사용자가 실제로 참가한 이벤트만 가져오기
      const supabase = createClient()

      const { data: participations, error } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            max_participants,
            current_participants,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      if (error) {
        console.error('참가 이벤트 조회 오류:', error)
        setEvents([])
        return
      }

      // 이벤트 데이터 추출 및 상태 계산
      const userEvents = participations?.map(participation => {
        const event = (participation as any).events
        if (!event) return null

        // 이벤트 상태 계산
        const now = new Date()
        const startDate = new Date(event.start_date)
        const endDate = new Date(event.end_date)

        let status = 'upcoming'
        if (now >= startDate && now < endDate) {
          status = 'ongoing'
        } else if (now >= endDate) {
          status = 'completed'
        }

        return {
          ...event,
          status
        }
      }).filter(Boolean) || []

      setEvents(userEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    }
  }

  // 유틸리티 함수들
  const getDisplayName = () => {
    return user?.full_name || user?.email || '사용자'
  }

  const getInitial = () => {
    const name = getDisplayName()
    return name.charAt(0).toUpperCase()
  }

  // 이벤트 필터링
  const ongoingEvents = events.filter(event => event.status === 'ongoing')
  const upcomingEventsFiltered = events.filter(event => event.status === 'upcoming')
  const completedEvents = events.filter(event => event.status === 'completed')

  useEffect(() => {
    if (user?.id) {
      const loadAllData = async () => {
        setLoading(true)
        await Promise.all([
          loadUserCard(),
          loadCollectedCards(),
          loadEvents()
        ])
        setLoading(false)
      }
      loadAllData()
    }
  }, [user?.id])

  // 실시간 이벤트 참가 감지
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()

    // event_participants 테이블 변경 감지
    const channel = supabase
      .channel('event_participants_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_participants',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('새로운 이벤트 참가 감지:', payload)
          // 이벤트 목록 새로고침
          loadEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              ndrop
            </h1>
            <p className="text-gray-600">
              로딩 중...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600">
            홈페이지를 보려면 로그인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b border-gray-200 px-5 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-4">
          {/* 프로필 아바타 */}
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{getInitial()}</span>
          </div>
          {/* 환영 메시지 */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              안녕하세요, {getDisplayName()}님!
            </h1>
            <p className="text-gray-600 text-sm">
              오늘도 좋은 만남이 있기를 🤝
            </p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-3">
          <Link href="/client/scan-card" className="flex-1">
            <Card className="bg-purple-600 text-white border-0 hover:bg-purple-700 transition-colors h-[87px]">
              <CardContent className="p-5 text-center">
                <Camera className="w-4 h-4 mx-auto mb-2 text-white" />
                <p className="text-sm">명함 스캔</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/events/join" className="flex-1">
            <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors h-[87px]">
              <CardContent className="p-5 text-center">
                <Calendar className="w-4 h-4 mx-auto mb-2 text-gray-700" />
                <p className="text-sm text-gray-700">행사참가</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-6">
        {/* 내 명함 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[]">내 명함</h2>
              <Link href="/client/my-qr">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  내 QR코드
                </Button>
              </Link>
            </div>
            <Link href="/client/my-namecard">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{getInitial()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{getDisplayName()}</h3>
                  <p className="text-sm text-gray-600">
                    {userCard?.job_title && userCard?.company
                      ? `${userCard.job_title} / ${userCard.company}`
                      : userCard?.work_field
                        ? userCard.work_field
                        : '프로필을 완성해주세요'
                    }
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* 내 이벤트 참가 기록 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">내 이벤트 참가 기록</h2>
              <Link href="/client/events/history">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  전체 보기
                </Button>
              </Link>
            </div>

            {/* 토글 버튼들 */}
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              {(['진행중', '예정', '종료'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 ${
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* 이벤트 목록 */}
            <div className="space-y-4">
              {(() => {
                let filteredEvents: any[] = []

                if (activeTab === '진행중') {
                  filteredEvents = ongoingEvents
                } else if (activeTab === '예정') {
                  filteredEvents = upcomingEventsFiltered
                } else if (activeTab === '종료') {
                  filteredEvents = completedEvents
                }

                return filteredEvents.length > 0 ? (
                  filteredEvents.slice(0, 1).map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          {activeTab}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          이벤트 일시: {new Date(event.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.start_date).toLocaleDateString()} 참가 신청
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {activeTab} 이벤트가 없습니다
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
