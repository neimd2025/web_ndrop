"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserProfile, UserEvent, UserNotification } from '@/lib/supabase/user-server-actions'
import { businessCardAPI, collectedCardAPI, eventAPI, userProfileAPI } from '@/lib/supabase/database'
import { Calendar, Camera, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserHomeClientProps {
  user: UserProfile
  upcomingEvents: UserEvent[]
  recentNotifications: UserNotification[]
  businessCardStats: {
    totalViews: number
    totalShares: number
    publicCards: number
  }
}

export function UserHomeClient({
  user,
  upcomingEvents: initialEvents,
  recentNotifications,
  businessCardStats
}: UserHomeClientProps) {
  const [events, setEvents] = useState<any[]>(initialEvents || [])
  const [userCard, setUserCard] = useState<any>(null)
  const [collectedCards, setCollectedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'진행중' | '예정' | '종료'>('진행중')

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
    try {
      const eventsData = await eventAPI.getAllEvents()
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading events:', error)
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

  return (
    <div className="min-h-screen">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b border-gray-200 px-5 py-10">
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
            <Card className="bg-purple-600 text-white border-0 hover:bg-purple-700 transition-colors">
              <CardContent className="p-5 text-center">
                <Camera className="w-4 h-4 mx-auto mb-4 text-white" />
                <p className="text-sm">명함 스캔</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/events/join" className="flex-1">
            <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-5 text-center">
                <Calendar className="w-4 h-4 mx-auto mb-4 text-gray-700" />
                <p className="text-sm text-gray-700">행사참가</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-6">
        {/* 통계 카드들 */}
        <div className="flex gap-3">
          <Card className="flex-1 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{businessCardStats.totalViews}</p>
                <p className="text-sm text-gray-600">프로필 조회수</p>
              </div>
              <Star className="w-6 h-6 text-purple-600" />
            </CardContent>
          </Card>

          <Card className="flex-1 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {events.length}
                </p>
                <p className="text-sm text-gray-600">참가 행사</p>
              </div>
              <Calendar className="w-6 h-6 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        {/* 내 명함 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">내 명함</h2>
              <Link href="/client/my-qr">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  내 QR코드
                </Button>
              </Link>
            </div>
            <Link href="/client/my-namecard">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-lg">{getInitial()}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{getDisplayName()}</h3>
                  <p className="text-sm text-gray-600">
                    {`${userCard?.role || '직책'} / ${userCard?.company || '회사'}`}
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* 내 이벤트 참가 기록 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
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