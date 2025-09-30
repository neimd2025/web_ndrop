"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserEvent, UserProfile } from '@/lib/supabase/user-server-actions'
import { ArrowLeft, Calendar, MapPin, QrCode, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserEventsAvailableClientProps {
  user: UserProfile
  availableEvents: UserEvent[]
}

export function UserEventsAvailableClient({ user, availableEvents: initialEvents }: UserEventsAvailableClientProps) {
  const router = useRouter()
  const [events, setEvents] = useState<UserEvent[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>(initialEvents)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'ongoing'>('all')
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [eventCode, setEventCode] = useState(['', '', '', '', '', ''])
  const [joiningByCode, setJoiningByCode] = useState(false)

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
  }, [events, searchTerm, selectedFilter])

  // 이벤트 코드 입력 핸들러
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return // 한 글자만 입력 가능

    const newCode = [...eventCode]
    newCode[index] = value.toUpperCase()
    setEventCode(newCode)

    // 다음 입력 필드로 포커스
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  // 이벤트 참가 (코드로)
  const handleJoinByCode = async () => {
    const code = eventCode.join('')
    if (code.length !== 6) {
      alert('6자리 이벤트 코드를 입력해주세요.')
      return
    }

    setJoiningByCode(true)
    try {
      const response = await fetch('/api/user/join-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventCode: code,
          userId: user.id
        })
      })

      const result = await response.json()
      console.log('이벤트 참가 응답:', result)

      if (response.ok && result.success) {
        alert('이벤트에 성공적으로 참가했습니다!')
        setShowCodeInput(false)
        setEventCode(['', '', '', '', '', ''])
        // 페이지 새로고침하여 참가한 이벤트 목록 업데이트
        router.refresh()
      } else {
        console.error('이벤트 참가 실패:', result)
        alert(result.message || result.error || '이벤트 참가에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      alert('이벤트 참가 중 오류가 발생했습니다.')
    } finally {
      setJoiningByCode(false)
    }
  }

  // 이벤트 참가 (직접)
  const handleJoinEvent = async (eventId: string) => {
    setJoiningEventId(eventId)
    try {
      const response = await fetch('/api/user/join-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          userId: user.id
        })
      })

      const result = await response.json()
      console.log('직접 이벤트 참가 응답:', result)

      if (response.ok && result.success) {
        alert('이벤트에 성공적으로 참가했습니다!')
        // 페이지 새로고침하여 참가한 이벤트 목록 업데이트
        router.refresh()
      } else {
        console.error('이벤트 참가 실패:', result)
        alert(result.message || result.error || '이벤트 참가에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      alert('이벤트 참가 중 오류가 발생했습니다.')
    } finally {
      setJoiningEventId(null)
    }
  }

  const getStatusBadge = (event: UserEvent) => {
    const status = calculateEventStatus(event)
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">예정</Badge>
      case 'ongoing':
        return <Badge variant="default">진행중</Badge>
      case 'completed':
        return <Badge variant="outline">종료</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen ">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/client/events" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">이벤트 참가</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 검색 및 필터 */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="이벤트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'upcoming', label: '예정' },
              { key: 'ongoing', label: '진행중' }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter.key as any)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 이벤트 코드로 참가 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <QrCode className="w-5 h-5 mr-2" />
              이벤트 코드로 참가
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showCodeInput ? (
              <Button
                onClick={() => setShowCodeInput(true)}
                className="w-full"
                variant="outline"
              >
                이벤트 코드 입력하기
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {eventCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      value={digit}
                      onChange={(e) => handleCodeInput(index, e.target.value)}
                      className="w-12 h-12 text-center text-lg font-mono"
                      maxLength={1}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleJoinByCode}
                    disabled={joiningByCode || eventCode.join('').length !== 6}
                    className="flex-1"
                  >
                    {joiningByCode ? '참가 중...' : '참가하기'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCodeInput(false)
                      setEventCode(['', '', '', '', '', ''])
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이벤트 목록 */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">참가 가능한 이벤트가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    {getStatusBadge(event)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.start_date)} ~ {formatDate(event.end_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {event.current_participants} / {event.max_participants}명
                    </div>
                  </div>

                  <Button
                    onClick={() => handleJoinEvent(event.id)}
                    disabled={joiningEventId === event.id || calculateEventStatus(event) === 'completed'}
                    className="w-full"
                  >
                    {joiningEventId === event.id ? '참가 중...' : '참가하기'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
