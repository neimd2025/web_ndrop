"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { feedbackAPI } from '@/lib/supabase/database'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, Clock, Lightbulb, MapPin, MessageSquare, Pin, QrCode, Star, Target, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

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
  backUrl?: string
}

export function EventDetailCard({
  event,
  showEventCode = true,
  showOrganizerInfo = true,
  backUrl
}: EventDetailCardProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 피드백 제출 함수
  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('평점을 선택해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('로그인이 필요합니다')
        return
      }

      const result = await feedbackAPI.createFeedback({
        user_id: user.id,
        event_id: event.id,
        rating: rating,
        feedback: feedbackText.trim() || null
      })

      if (result) {
        toast.success('피드백이 성공적으로 전송되었습니다!')
        setShowFeedbackModal(false)
        setFeedbackText('')
        setRating(0)
      } else {
        toast.error('피드백 전송에 실패했습니다')
      }
    } catch (error) {
      console.error('피드백 제출 오류:', error)
      toast.error('피드백 전송 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }
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
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">예정</Badge>
      case 'ongoing':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">진행중</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">종료</Badge>
      default:
        return <Badge variant="secondary">예정</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 뒤로가기 버튼 */}
      {backUrl && (
        <div className="mb-4">
          <Link href={backUrl}>
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
          </Link>
        </div>
      )}

      {/* 이벤트 헤더 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event.title}
            </h1>
            {getStatusBadge(event.status)}
          </div>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* 이벤트 개요 */}
      {(event.overview_points && event.overview_points.length > 0) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">이벤트 개요</h2>
            </div>
            <ul className="space-y-2 text-gray-700">
              {event.overview_points.map((point, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 참가 대상 */}
      {(event.target_audience && event.target_audience.length > 0) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">참가 대상</h2>
            </div>
            <ul className="space-y-2 text-gray-700">
              {event.target_audience.map((audience, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {audience}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 특별 혜택 */}
      {(event.special_benefits && event.special_benefits.length > 0) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900">특별 혜택</h2>
            </div>
            <ul className="space-y-2 text-gray-700">
              {event.special_benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 이벤트 이미지 */}
      {event.image_url && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-64 w-full">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이벤트 상세 정보 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">이벤트 정보</h2>
          <div className="space-y-6">
            {/* Row 1: 날짜 | 참가자 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">날짜</p>
                  <p className="font-medium">{formatDate(event.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">참가자</p>
                  <p className="font-medium">{event.current_participants}명</p>
                </div>
              </div>
            </div>

            {/* Row 2: 지역 | 이벤트코드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.region ? (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">지역</p>
                    <p className="font-medium">{event.region}</p>
                  </div>
                </div>
              ) : <div />} {/* 지역이 없을 경우 빈 div로 자리 유지 */}
              
              {showEventCode && (
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">이벤트 코드</p>
                    <p className="font-medium font-mono">{event.event_code}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: 시간 */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">시간</p>
                <p className="font-medium">
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </p>
              </div>
            </div>

            {/* Row 4: 장소 */}
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">장소</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 현황 */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {event.current_participants}
            </div>
            <p className="text-blue-800 font-medium">참가자</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {event.max_participants}
            </div>
            <p className="text-green-800 font-medium">최대인원</p>
          </CardContent>
        </Card>
      </div>

      {/* 주최자 정보 */}
      {showOrganizerInfo && event.organizer_name && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">주최자 정보</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">주최자</p>
                <p className="font-medium">{event.organizer_name}</p>
              </div>

              {event.organizer_email && (
                <div>
                  <p className="text-sm text-gray-500">문의 이메일</p>
                  <p className="font-medium">{event.organizer_email}</p>
                </div>
              )}

              {event.organizer_kakao && (
                <div>
                  <p className="text-sm text-gray-500">카카오톡</p>
                  <p className="font-medium">{event.organizer_kakao}</p>
                </div>
              )}

              {event.organizer_phone && (
                <div>
                  <p className="text-sm text-gray-500">전화</p>
                  <p className="font-medium">{event.organizer_phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
