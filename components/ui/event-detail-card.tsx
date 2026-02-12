// @ts-nocheck
"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { eventParticipantAPI } from '@/lib/supabase/database'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, Clock, Lightbulb, MapPin, Pin, QrCode, Target, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

interface EventDetailCardProps {
  event: {
    id: string
    title: string
    description: string
    start_date: string
    end_date: string
    location: string
    max_participants: number
    current_participants: number
    event_code: string
    image_url?: string
    status: 'upcoming' | 'ongoing' | 'completed'
    organizer_name?: string
    organizer_email?: string
    region?: string | null
    organizer_phone?: string
    organizer_kakao?: string
    // 동적 콘텐츠 필드들
    overview_points?: string[]
    target_audience?: string[]
    special_benefits?: string[]
  }
  showEventCode?: boolean
  showOrganizerInfo?: boolean
  onJoinSuccess?: () => void
  onLeaveSuccess?: () => void
  isDarkTheme?: boolean
}

export function EventDetailCard({
  event: initialEvent,
  showEventCode = true,
  showOrganizerInfo = true,
  onJoinSuccess,
  onLeaveSuccess,
  isDarkTheme = false,
}: EventDetailCardProps) {
  const [event, setEvent] = useState(initialEvent)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isParticipating, setIsParticipating] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const searchParams = useSearchParams()
  const source = searchParams.get('source')

  // Theme helper classes
  const cardBgClass = isDarkTheme 
    ? "bg-slate-900/40 border border-white/10 text-white backdrop-blur-md shadow-xl" 
    : "bg-white"
  const textTitleClass = isDarkTheme ? "text-white" : "text-gray-900"
  const textBodyClass = isDarkTheme ? "text-slate-300" : "text-gray-600"
  const textLabelClass = isDarkTheme ? "text-slate-400" : "text-gray-500"
  const textValueClass = isDarkTheme ? "text-slate-200" : "font-medium"
  const iconClass = isDarkTheme ? "text-slate-400" : "text-gray-500"
  
  // 뒤로가기 경로 결정
  const getBackUrl = () => {
    switch (source) {
      case 'admin':
        return '/admin/events'
      case 'history':
        return '/client/events/history'
      case 'public':
        return '/client/public-events'
      default:
        return '/client/events' // 기본값
    }
  }

  // 현재 사용자와 참가 여부 확인
  useEffect(() => {
    const checkUserAndParticipation = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setCurrentUser(user)
          try {
            // EventAPI 함수명 확인 필요 - 실제 함수명에 맞게 수정
            const participation = await eventParticipantAPI.getUserParticipation(event.id, user.id)
            setIsParticipating(participation)
          } catch (error) {
            console.error('참가 여부 확인 오류:', error)
            // 에러 발생 시 기본값 설정
            setIsParticipating(false)
          }
        }
      } catch (error) {
        console.error('사용자 확인 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUserAndParticipation()
  }, [event.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className={isDarkTheme ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-800"}>예정</Badge>
      case 'ongoing':
        return <Badge variant="secondary" className={isDarkTheme ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-green-100 text-green-800"}>진행중</Badge>
      case 'completed':
        return <Badge variant="secondary" className={isDarkTheme ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" : "bg-gray-100 text-gray-800"}>종료</Badge>
      default:
        return <Badge variant="secondary">예정</Badge>
    }
  }

  // 이벤트 참가 처리
  const handleJoinEvent = async () => {
    if (!currentUser) {
      toast.error('이벤트 참가를 위해서는 로그인이 필요합니다.')
      return
    }

    try {
      setActionLoading(true)
      
      // EventAPI 함수명 확인 필요
      const result = await eventParticipantAPI.joinEvent(event.id, currentUser.id)

      if (result) {
        setIsParticipating(true)
        // 이벤트 참가자 수 업데이트
        setEvent(prev => ({
          ...prev,
          current_participants: prev.current_participants + 1
        }))
        toast.success('이벤트에 성공적으로 참가했습니다!')
        onJoinSuccess?.()
      } else {
        throw new Error('이벤트 참가에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('Error joining event:', err)
      toast.error(err.message || '이벤트 참가 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  // 이벤트 참가 취소 처리
  const handleCancelEvent = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      setActionLoading(true)

      // EventAPI 함수명 확인 필요
      const result = await eventParticipantAPI.leaveEvent(event.id, currentUser.id)

      if (result) {
        setIsParticipating(false)
        // 이벤트 참가자 수 업데이트
        setEvent(prev => ({
          ...prev,
          current_participants: Math.max(0, prev.current_participants - 1)
        }))
        toast.success('이벤트 참가를 취소했습니다.')
        onLeaveSuccess?.()
      } else {
        throw new Error('이벤트 참가 취소에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('Error canceling event:', err)
      toast.error(err.message || '이벤트 참가 취소 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const getActionButton = () => {
    if (loading) {
      return (
        <Button disabled className="w-full bg-gray-400">
          로딩 중...
        </Button>
      )
    }

    const isEventFull = event.max_participants && event.current_participants >= event.max_participants
    const isPastEvent = new Date(event.end_date) < new Date()

    if (actionLoading) {
      return (
        <Button disabled className="w-full bg-purple-400">
          처리 중...
        </Button>
      )
    }

    if (isPastEvent) {
      return (
        <Button disabled className="w-full bg-gray-400">
          지난 이벤트
        </Button>
      )
    }

    if (isEventFull && !isParticipating) {
      return (
        <Button disabled className="w-full bg-gray-400">
          마감된 이벤트
        </Button>
      )
    }

    if (isParticipating) {
      return (
        <Button 
          onClick={handleCancelEvent}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          참가 취소하기
        </Button>
      )
    }

    return (
      <Button 
        onClick={handleJoinEvent}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        참가하기
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 뒤로가기 버튼 */}
      <div className="mb-4">
        <Link href={getBackUrl()}>
          <Button variant="ghost" className={`flex items-center gap-2 ${isDarkTheme ? 'text-white hover:text-white/80 hover:bg-white/10' : ''}`}>
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
        </Link>
      </div>

      {/* 이벤트 헤더 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold mb-2 ${textTitleClass}`}>
              {event.title}
            </h1>
            {getStatusBadge(event.status)}
          </div>
        </div>

        <p className={`text-lg leading-relaxed ${textBodyClass}`}>
          {event.description}
        </p>
      </div>

      {/* 이벤트 개요 */}
      {(event.overview_points && event.overview_points.length > 0) && (
        <Card className={`border-0 shadow-lg ${cardBgClass} relative overflow-hidden group`}>
          {isDarkTheme && <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent group-hover:from-red-500/10 transition-colors" />}
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <div className={isDarkTheme ? "bg-red-500/20 p-2 rounded-xl" : ""}>
                <Pin className={`h-5 w-5 ${isDarkTheme ? "text-red-400" : "text-red-500"}`} />
              </div>
              <h2 className={`text-xl font-semibold ${textTitleClass}`}>이벤트 개요</h2>
            </div>
            <ul className={`space-y-2 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              {event.overview_points.map((point, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkTheme ? "bg-red-400" : "bg-red-500"}`}></div>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 참가 대상 */}
      {(event.target_audience && event.target_audience.length > 0) && (
        <Card className={`border-0 shadow-lg ${cardBgClass} relative overflow-hidden group`}>
          {isDarkTheme && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent group-hover:from-blue-500/10 transition-colors" />}
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <div className={isDarkTheme ? "bg-blue-500/20 p-2 rounded-xl" : ""}>
                <Target className={`h-5 w-5 ${isDarkTheme ? "text-blue-400" : "text-blue-500"}`} />
              </div>
              <h2 className={`text-xl font-semibold ${textTitleClass}`}>참가 대상</h2>
            </div>
            <ul className={`space-y-2 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              {event.target_audience.map((audience, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkTheme ? "bg-blue-400" : "bg-blue-500"}`}></div>
                  {audience}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 특별 혜택 */}
      {(event.special_benefits && event.special_benefits.length > 0) && (
        <Card className={`border-0 shadow-lg ${cardBgClass} relative overflow-hidden group`}>
          {isDarkTheme && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent group-hover:from-yellow-500/10 transition-colors" />}
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <div className={isDarkTheme ? "bg-yellow-500/20 p-2 rounded-xl" : ""}>
                <Lightbulb className={`h-5 w-5 ${isDarkTheme ? "text-yellow-400" : "text-yellow-500"}`} />
              </div>
              <h2 className={`text-xl font-semibold ${textTitleClass}`}>특별 혜택</h2>
            </div>
            <ul className={`space-y-2 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              {event.special_benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkTheme ? "bg-yellow-400" : "bg-yellow-500"}`}></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 이벤트 이미지 */}
      {event.image_url && (
        <Card className={`border-0 shadow-lg overflow-hidden ${cardBgClass}`}>
          <CardContent className="p-0">
            <div className="relative h-64 w-full">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이벤트 상세 정보 */}
      <Card className={`border-0 shadow-lg ${cardBgClass}`}>
        <CardContent className="p-6">
          <h2 className={`text-xl font-semibold mb-6 ${textTitleClass}`}>이벤트 정보</h2>
          <div className="space-y-6">
            {/* Row 1: 날짜 | 참가자 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className={`h-5 w-5 ${iconClass}`} />
                <div>
                  <p className={`text-sm ${textLabelClass}`}>날짜</p>
                  <p className={`${textValueClass}`}>{formatDate(event.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className={`h-5 w-5 ${iconClass}`} />
                <div>
                  <p className={`text-sm ${textLabelClass}`}>참가자</p>
                  <p className={`${textValueClass}`}>{event.current_participants}명</p>
                </div>
              </div>
            </div>

            {/* Row 2: 지역 | 이벤트코드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.region ? (
                <div className="flex items-center gap-3">
                  <MapPin className={`h-5 w-5 ${iconClass}`} />
                  <div>
                    <p className={`text-sm ${textLabelClass}`}>지역</p>
                    <p className={`${textValueClass}`}>{event.region}</p>
                  </div>
                </div>
              ) : <div />}
              
              {showEventCode && (
                <div className="flex items-center gap-3">
                  <QrCode className={`h-5 w-5 ${iconClass}`} />
                  <div>
                    <p className={`text-sm ${textLabelClass}`}>이벤트 코드</p>
                    <p className={`${textValueClass} font-mono`}>{event.event_code}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: 시간 */}
            <div className="flex items-center gap-3">
              <Clock className={`h-5 w-5 ${iconClass}`} />
              <div>
                <p className={`text-sm ${textLabelClass}`}>시간</p>
                <p className={`${textValueClass}`}>
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </p>
              </div>
            </div>

            {/* Row 4: 장소 */}
            <div className="flex items-center gap-3">
              <MapPin className={`h-5 w-5 ${iconClass}`} />
              <div>
                <p className={`text-sm ${textLabelClass}`}>장소</p>
                <p className={`${textValueClass}`}>{event.location}</p>
              </div>
            </div>
          </div>
          
{source !== "admin" && (
          <div className="mt-6">
            {getActionButton()}
          </div>)}
        </CardContent>
      </Card>

      {/* 이벤트 현황 */}
      <div className="grid grid-cols-2 gap-6">
        <Card className={`border-0 shadow-lg ${isDarkTheme ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <CardContent className="p-6 text-center">
            <div className={`text-4xl font-bold mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
              {event.current_participants}
            </div>
            <p className={`${isDarkTheme ? 'text-blue-300' : 'text-blue-800'} font-medium`}>참가자</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${isDarkTheme ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <CardContent className="p-6 text-center">
            <div className={`text-4xl font-bold mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
              {event.max_participants}
            </div>
            <p className={`${isDarkTheme ? 'text-green-300' : 'text-green-800'} font-medium`}>최대인원</p>
          </CardContent>
        </Card>
      </div>

      {/* 주최자 정보 */}
      {showOrganizerInfo && event.organizer_name && (
        <Card className={`border-0 shadow-lg ${cardBgClass}`}>
          <CardContent className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${textTitleClass}`}>주최자 정보</h2>
            <div className="space-y-3">
              <div>
                <p className={`text-sm ${textLabelClass}`}>주최자</p>
                <p className={`${textValueClass}`}>{event.organizer_name}</p>
              </div>

              {event.organizer_email && (
                <div>
                  <p className={`text-sm ${textLabelClass}`}>문의 이메일</p>
                  <p className={`${textValueClass}`}>{event.organizer_email}</p>
                </div>
              )}

              {event.organizer_phone && (
                <div>
                  <p className={`text-sm ${textLabelClass}`}>전화</p>
                  <p className={`${textValueClass}`}>{event.organizer_phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
