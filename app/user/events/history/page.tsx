"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculateEventStatus, filterEventsByStatus } from '@/lib/supabase/database'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function EventHistoryPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'진행중' | '예정' | '종료'>('진행중')
  const router = useRouter()

  // 이벤트 필터링 - 현재 시간 기준으로 상태 계산
  const ongoingEvents = filterEventsByStatus(events, 'ongoing')
  const upcomingEvents = filterEventsByStatus(events, 'upcoming')
  const completedEvents = filterEventsByStatus(events, 'completed')

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)

      // 사용자가 참가한 이벤트만 가져오기
      const { data, error } = await createClient()
        .from('event_participants')
        .select(`
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            max_participants,
            current_participants,
            event_code,
            image_url,
            organizer_name,
            organizer_email,
            organizer_phone,
            organizer_kakao,
            created_at
          )
        `)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('참가 이벤트 로드 오류:', error)
        return
      }

      // events 데이터 추출
      const userEvents = data?.map((item: any) => item.events).filter(Boolean) || []
      setEvents(userEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const getEventsByTab = () => {
    switch (activeTab) {
      case '진행중':
        return ongoingEvents
      case '예정':
        return upcomingEvents
      case '종료':
        return completedEvents
      default:
        return []
    }
  }

  const getStatusBadge = (event: any) => {
    const status = calculateEventStatus(event)
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">진행중</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">예정</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">종료</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filteredEvents = getEventsByTab()

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이벤트 기록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">이벤트 히스토리</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 탭 버튼들 */}
        <div className="flex gap-2">
          {(['진행중', '예정', '종료'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "bg-purple-600" : ""}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                <div className="relative">
                  {/* 이벤트 이미지 */}
                  <div className="h-32 relative overflow-hidden">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-white opacity-50" />
                      </div>
                    )}

                    {/* 오버레이 및 상태 배지 */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {getStatusBadge(event)}
                      <span className="text-white text-xs bg-black bg-opacity-30 px-2 py-1 rounded-full">
                        {new Date(event.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}. 제출
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Button variant="ghost" size="sm" className="bg-black bg-opacity-20 hover:bg-opacity-30 text-white">
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 text-white">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">{event.location || "온라인"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 이벤트 정보 */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.start_date).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Seoul'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>제출자: {event.current_participants || 0}명</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">코드:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                          {event.event_code}
                        </code>
                      </div>
                      <div className="w-4 h-4 border border-purple-600 rounded-sm relative">
                        <div className="absolute inset-0.5 border border-purple-600 rounded-sm"></div>
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-purple-600 rounded-full"></div>
                        <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-purple-600 rounded-full"></div>
                      </div>
                    </div>

                    {/* 상세보기 버튼 */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-200"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <Users className="h-4 w-4" />
                        상세보기
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab} 참가 이벤트가 없습니다
              </h3>
              <p className="text-gray-600 text-sm">
                새로운 이벤트에 참가해보세요!
              </p>
            </div>
          )}
        </div>

        {/* 새 이벤트 참가 버튼 */}
        <div className="text-center pt-4">
          <Link href="/events/join">
            <Button className="bg-purple-600 hover:bg-purple-700">
              새 이벤트 참가하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
