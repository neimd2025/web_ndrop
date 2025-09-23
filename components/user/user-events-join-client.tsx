"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserEvent, UserEventParticipation, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, MapPin, QrCode, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserEventsJoinClientProps {
  user: UserProfile
  events: UserEvent[]
  userParticipations: UserEventParticipation[]
}

export function UserEventsJoinClient({ user, events: initialEvents, userParticipations }: UserEventsJoinClientProps) {
  const router = useRouter()
  const [events, setEvents] = useState<UserEvent[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>(initialEvents)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'ongoing'>('all')
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [eventCode, setEventCode] = useState(['', '', '', '', '', ''])
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [recentEvents, setRecentEvents] = useState<UserEvent[]>([])

  // 이벤트 상태 계산
  const calculateEventStatus = (event: UserEvent): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date()
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)

    if (now < startDate) return 'upcoming'
    if (now >= startDate && now <= endDate) return 'ongoing'
    return 'completed'
  }

  // 이벤트 필터링
  useEffect(() => {
    let filtered = events

    // 상태 필터
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(event => calculateEventStatus(event) === selectedFilter)
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }, [events, selectedFilter, searchTerm])

  // 이벤트 참가
  const handleJoinEvent = async (eventId: string) => {
    if (!user?.id) return

    setJoiningEventId(eventId)
    try {
      const supabase = createClient()

      // 이미 참가했는지 확인
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

      if (existingParticipation) {
        alert('이미 참가 신청한 이벤트입니다.')
        return
      }

      // 참가 신청
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) {
        console.error('이벤트 참가 오류:', error)
        alert('이벤트 참가에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // 이벤트 참가자 수 업데이트
      const { error: updateError } = await supabase.rpc('increment_event_participants', {
        event_id: eventId
      })

      if (updateError) {
        console.warn('참가자 수 업데이트 실패:', updateError)
      }

      alert('이벤트 참가 신청이 완료되었습니다!')

      // 이벤트 목록 새로고침
      const { data: updatedEvents } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (updatedEvents) {
        setEvents(updatedEvents)
      }

    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      alert('이벤트 참가에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setJoiningEventId(null)
    }
  }

  // 상태 배지
  const getStatusBadge = (event: UserEvent) => {
    const status = calculateEventStatus(event)
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">진행중</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">예정</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">종료</Badge>
    }
  }

  // 이미 참여한 이벤트인지 확인
  const isParticipatedEvent = (eventId: string) => {
    return userParticipations.some(participation =>
      participation.event_id === eventId && participation.status === 'confirmed'
    )
  }

  // 참가 가능 여부 확인
  const canJoinEvent = (event: UserEvent) => {
    const status = calculateEventStatus(event)
    return (status === 'upcoming' || status === 'ongoing') && !isParticipatedEvent(event.id)
  }

  // 이벤트 코드 입력 처리
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const upperValue = value.toUpperCase()
    const newCode = [...eventCode]
    newCode[index] = upperValue
    setEventCode(newCode)

    // 다음 입력 필드로 자동 이동
    if (upperValue && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !eventCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  // 이벤트 코드로 참가
  const handleJoinByCode = async () => {
    const code = eventCode.join('')
    if (code.length !== 6) {
      alert('6자리 이벤트 코드를 입력해주세요.')
      return
    }

    setJoiningByCode(true)
    try {
      const supabase = createClient()

      // 이벤트 코드로 이벤트 찾기
      const { data: event, error: findError } = await supabase
        .from('events')
        .select('*')
        .eq('event_code', code)
        .single()

      if (findError || !event) {
        alert('유효하지 않은 이벤트 코드입니다.')
        return
      }

      // 이미 참가했는지 확인
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single()

      if (existingParticipation) {
        alert('이미 참가한 이벤트입니다.')
        router.push(`/client/events/${event.id}`)
        return
      }

      // 이벤트 참가
      const { error: joinError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed'
        })

      if (joinError) {
        console.error('이벤트 참가 오류:', joinError)
        alert('이벤트 참가에 실패했습니다.')
        return
      }

      // 참가자 수 업데이트
      const { error: updateError } = await supabase.rpc('increment_event_participants', {
        event_id: event.id
      })

      if (updateError) {
        console.warn('참가자 수 업데이트 실패:', updateError)
      }

      alert('이벤트에 참가했습니다!')
      router.push(`/client/events/${event.id}`)

    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      alert('이벤트 참가에 실패했습니다.')
    } finally {
      setJoiningByCode(false)
    }
  }

  // 사용자가 참가한 이벤트 가져오기
  const fetchUserEvents = async () => {
    if (!user?.id) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          events (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('참가 이벤트 가져오기 오류:', error)
        return
      }

      const userEvents = data?.map((item: any) => item.events).filter(Boolean) || []
      setRecentEvents(userEvents)
    } catch (error) {
      console.error('참가 이벤트 가져오기 오류:', error)
    }
  }

  // 컴포넌트 마운트 시 사용자 참가 이벤트 로드
  useEffect(() => {
    fetchUserEvents()
  }, [user?.id])

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/client/home">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">이벤트 참가</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 참가 방법 선택 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex gap-2">
          <Button
            variant={!showCodeInput ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCodeInput(false)}
            className={!showCodeInput ? "bg-purple-600 text-white" : ""}
          >
            이벤트 목록
          </Button>
          <Button
            variant={showCodeInput ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCodeInput(true)}
            className={showCodeInput ? "bg-purple-600 text-white" : ""}
          >
            코드 입력
          </Button>
          <Link href="/client/scan-card" className="ml-auto">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1" />
              QR 스캔
            </Button>
          </Link>
        </div>
      </div>

      {showCodeInput ? (
        /* 이벤트 코드 입력 섹션 */
        <div className="px-5 py-8 space-y-8">
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* 제목 */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">이벤트 코드를 입력하세요</h2>
            <p className="text-base text-gray-500">
              주최자에게 받은 6자리 코드를 입력해주세요
            </p>
          </div>

          {/* 6자리 코드 입력 */}
          <div className="flex justify-center gap-2.5">
            {eventCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-lg font-mono border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                style={{ textTransform: 'uppercase' }}
                maxLength={1}
                autoComplete="off"
              />
            ))}
          </div>

          {/* 참가하기 버튼 */}
          <div className="flex justify-center">
            <Button
              onClick={handleJoinByCode}
              disabled={joiningByCode || eventCode.join('').length !== 6}
              className="w-full h-15 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg rounded-xl"
            >
              {joiningByCode ? '참가 중...' : '이벤트 참가하기'}
            </Button>
          </div>

          {/* 최근 참가한 이벤트 */}
          {recentEvents.length > 0 && (
            <Card className="border border-gray-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">
                  최근 참가한 이벤트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-700 text-base">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/client/events/${event.id}`)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* 검색 및 필터 */}
          <div className="bg-white border-b border-gray-200 px-5 py-4 space-y-4">
            {/* 검색바 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이벤트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 필터 버튼들 */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'upcoming', label: '예정' },
                { key: 'ongoing', label: '진행중' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(key as any)}
                  className={`${
                    selectedFilter === key
                      ? "bg-purple-600 text-white"
                      : "border-gray-200 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 이벤트 목록 */}
          <div className="px-5 py-6">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '참가할 수 있는 이벤트가 없습니다'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? '다른 검색어로 시도해보세요' : '새로운 이벤트가 곧 추가될 예정입니다'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="p-5 border border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          {getStatusBadge(event)}
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                          {' '}
                          {new Date(event.start_date).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{event.current_participants || 0}/{event.max_participants}명 참가</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/client/events/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          상세보기
                        </Button>
                      </Link>

                      {isParticipatedEvent(event.id) ? (
                        <Button disabled className="bg-green-600 text-white">
                          참가완료
                        </Button>
                      ) : canJoinEvent(event) ? (
                        <Button
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={joiningEventId === event.id || (event.current_participants >= event.max_participants)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {joiningEventId === event.id ? '신청중...' :
                           event.current_participants >= event.max_participants ? '마감' : '참가신청'}
                        </Button>
                      ) : (
                        <Button disabled variant="outline">
                          참가불가
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
