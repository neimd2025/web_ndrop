"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useEvents } from '@/hooks/use-events'
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
export default function EventJoinPage() {
  const { user } = useAuth()
  const { findEventByCode } = useEvents()
  const [eventCode, setEventCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const router = useRouter()



  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // 한 글자만 입력 가능

    // 소문자를 대문자로 변환
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
      // 이전 입력 필드로 이동
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement
      if (prevInput) {
        prevInput.focus()
      }
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
          events (
            id,
            title,
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
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('참가 이벤트 가져오기 오류:', error)
        return
      }

      // events 데이터 추출
      const userEvents = data?.map((item: any) => item.events).filter(Boolean) || []
      setRecentEvents(userEvents)
    } catch (error) {
      console.error('참가 이벤트 가져오기 오류:', error)
    }
  }

  const handleJoinEvent = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    const code = eventCode.join('')
    if (code.length !== 6) {
      toast.error('6자리 이벤트 코드를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const event = await findEventByCode(code)

      if (!event) {
        toast.error('유효하지 않은 이벤트 코드입니다.')
        return
      }

      // 실제 이벤트 참가 로직
      const supabase = createClient()

      // 이미 참가했는지 확인
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single()

      if (existingParticipation) {
        toast.error('이미 참가한 이벤트입니다.')
        router.push(`/events/${event.id}`)
        return
      }

      // 이벤트 참가 정보 추가
      const { error: joinError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          joined_at: new Date().toISOString()
        })

      if (joinError) {
        console.error('이벤트 참가 오류:', joinError)
        toast.error('이벤트 참가에 실패했습니다.')
        return
      }

      // 이벤트 참가자 수 업데이트
      const { error: updateError } = await supabase
        .from('events')
        .update({
          current_participants: (event.current_participants || 0) + 1
        })
        .eq('id', event.id)

      if (updateError) {
        console.error('참가자 수 업데이트 오류:', updateError)
      }

      toast.success('이벤트에 참가했습니다!')
      refreshUserEvents() // 최근 이벤트 목록 새로고침
      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      toast.error('이벤트 참가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 사용자 참가 이벤트 가져오기
  useEffect(() => {
    fetchUserEvents()
  }, [fetchUserEvents])

  // 이벤트 참가 성공 후 최근 이벤트 목록 새로고침
  const refreshUserEvents = () => {
    fetchUserEvents()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">행사 참가</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* 캘린더 아이콘 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* 이벤트 코드 입력 */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">행사 코드를 입력하세요</h2>
          <p className="text-base text-gray-500">
            주최자에게 받은 6자리 코드를 입력해주세요
          </p>
        </div>

        {/* 6자리 코드 입력 박스 */}
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
            onClick={handleJoinEvent}
            disabled={loading || eventCode.join('').length !== 6}
            className="w-full h-15 bg-purple-400 hover:bg-purple-500 text-white font-semibold text-lg rounded-xl"
          >
            {loading ? '참가 중...' : '행사 참가하기'}
          </Button>
        </div>

        {/* 최근 참가한 행사 */}
        {recentEvents.length > 0 && (
          <Card className="border border-gray-200 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">
                최근 참가한 행사
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg"
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
                    <div className="px-2 py-1 bg-green-100 rounded-full">
                      <span className="text-xs font-medium text-green-700">완료</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/events/${event.id}`)}
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

        {/* 이벤트 히스토리 링크 */}
        <div className="text-center">
          <Link href="/events/history">
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              참가한 이벤트 히스토리 보기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
