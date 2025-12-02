//@ts-nocheck
"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import EventCard from '@/components/user/user-event-card'
import { calculateEventStatus, filterEventsByStatus } from '@/lib/supabase/database'
import { UserEvent, UserEventParticipation, UserProfile } from '@/lib/supabase/user-server-actions'
import { ArrowLeft, Calendar, MapPin, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserEventsHistoryClientProps {
  user: UserProfile
  events: UserEvent[]
  userParticipations: UserEventParticipation[]
}

export function UserEventsHistoryClient({
  user,
  events,
  userParticipations
}: UserEventsHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<'진행중' | '예정' | '종료'>('진행중')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const router = useRouter()

  // 이벤트 필터링 - 현재 시간 기준으로 상태 계산
  const ongoingEvents = filterEventsByStatus(events, 'ongoing')
  const upcomingEvents = filterEventsByStatus(events, 'upcoming')
  const completedEvents = filterEventsByStatus(events, 'completed')

  // 검색 필터링 함수
  const filterEventsBySearch = (events: UserEvent[]) => {
    if (!searchTerm.trim()) return events

    return events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // 빈 액션 버튼 컴포넌트 (EventCard에 전달하기 위해 필요)
  const getActionButton = (event: UserEvent) => {
    return null; // 마이페이지에서는 액션 버튼 없음
  }

  const getCurrentEvents = () => {
    let currentEvents: UserEvent[] = []
    switch (activeTab) {
      case '진행중':
        currentEvents = ongoingEvents
        break
      case '예정':
        currentEvents = upcomingEvents
        break
      case '종료':
        currentEvents = completedEvents
        break
      default:
        currentEvents = []
    }

    return filterEventsBySearch(currentEvents)
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">참가 이벤트</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 검색바 */}
      <div className="bg-white px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="이벤트 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-5">
        {/* 토글 버튼들 */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
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
          {getCurrentEvents().length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab} 이벤트가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                새로운 이벤트에 참가해보세요!
              </p>
              <Link href="/client/events/join">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  이벤트 참가하기
                </Button>
              </Link>
            </div>
          ) : (
            getCurrentEvents().map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onJoinEvent={() => {}} // 마이페이지에서는 필요 없음
                actionLoading={actionLoading}
                currentUser={{ id: user.id, email: user.email }}
                getActionButton={getActionButton}
                param="history"
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}