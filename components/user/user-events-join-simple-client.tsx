"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserEvent, UserEventParticipation, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, QrCode, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useRef } from 'react'

interface UserEventsJoinSimpleClientProps {
  user: UserProfile
  userParticipations: UserEventParticipation[]
}

export function UserEventsJoinSimpleClient({ user, userParticipations }: UserEventsJoinSimpleClientProps) {
  const router = useRouter()
  const [eventCode, setEventCode] = useState(['', '', '', '', '', ''])
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [recentEvents, setRecentEvents] = useState<UserEvent[]>([])
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [joinCooldown, setJoinCooldown] = useState(0)
  const [successEventId, setSuccessEventId] = useState<string | null>(null)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastJoinTimeRef = useRef<number>(0)

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }
  }, [])

  // 쿨다운 타이머
  useEffect(() => {
    if (joinCooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setJoinCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) {
              clearInterval(cooldownTimerRef.current)
            }
            setJoinSuccess(false)
            setSuccessEventId(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }
  }, [joinCooldown])

  // 쿨다운 상태 확인
  const isOnCooldown = () => {
    const now = Date.now()
    const timeSinceLastJoin = now - lastJoinTimeRef.current
    return timeSinceLastJoin < 5000 // 5초 쿨다운
  }

  // 이벤트 코드 입력 핸들러
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // 한 글자만 입력 가능

    const newCode = [...eventCode]
    newCode[index] = value
    setEventCode(newCode)

    // 다음 입력 필드로 자동 이동
    if (value && index < 5) {
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
  const handleJoinByCode = useCallback(async () => {
    // 쿨다운 확인
    if (isOnCooldown()) {
      alert(`잠시 후 다시 시도해주세요. (${Math.ceil((5000 - (Date.now() - lastJoinTimeRef.current)) / 1000)}초 남음)`)
      return
    }

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
          status: 'confirmed',
          joined_at: new Date().toISOString()
        })

      if (joinError) {
        console.error('이벤트 참가 오류:', joinError)
        alert('이벤트 참가에 실패했습니다.')
        return
      }

      // 참가자 수 업데이트
      const { error: updateError } = await supabase
        .from('events')
        .update({ current_participants: event.current_participants + 1 })
        .eq('id', event.id)

      if (updateError) {
        console.warn('참가자 수 업데이트 실패:', updateError)
      }

      // 성공 상태 설정
      setJoinSuccess(true)
      setSuccessEventId(event.id)
      setJoinCooldown(5) // 5초 쿨다운 시작
      lastJoinTimeRef.current = Date.now() // 마지막 참가 시간 기록

      // 입력 필드 초기화
      setEventCode(['', '', '', '', '', ''])

      // 3초 후 이벤트 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/client/events/${event.id}`)
      }, 3000)

    } catch (error) {
      console.error('이벤트 참가 오류:', error)
      alert('이벤트 참가에 실패했습니다.')
    } finally {
      setJoiningByCode(false)
    }
  }, [eventCode, user?.id, router])

  // 사용자가 참가한 이벤트 가져오기
  const fetchUserEvents = useCallback(async () => {
    if (!user?.id) {
      setRecentEvents([])
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          events (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('참가 이벤트 가져오기 오류:', error)
        setRecentEvents([])
        return
      }

      const userEvents = data?.map((item: any) => item.events).filter(Boolean) || []
      setRecentEvents(userEvents)
    } catch (error) {
      console.error('참가 이벤트 가져오기 오류:', error)
      setRecentEvents([])
    }
  }, [user?.id])

  // 컴포넌트 마운트 시 사용자 참가 이벤트 로드
  useEffect(() => {
    fetchUserEvents()
  }, [fetchUserEvents])

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
          <h1 className="text-xl font-bold text-gray-900">이벤트 참가</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 참가 방법 선택 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">이벤트 참가</h2>
            <p className="text-sm text-gray-600">이벤트 코드를 입력하거나 QR 코드를 스캔하세요</p>
          </div>
          <Link href="/client/events/scan">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1" />
              QR 스캔
            </Button>
          </Link>
        </div>
      </div>

      {/* 이벤트 코드 입력 섹션 */}
      <div className="px-5 py-8 space-y-8">
        {/* 아이콘 */}
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            joinSuccess ? 'bg-green-50' : 'bg-purple-50'
          }`}>
            {joinSuccess ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Calendar className="w-8 h-8 text-purple-600" />
            )}
          </div>
        </div>

        {/* 제목과 설명 */}
        <div className="text-center">
          {joinSuccess ? (
            <>
              <h2 className="text-2xl font-bold text-green-700 mb-2">참가 성공!</h2>
              <p className="text-green-600">
                이벤트에 성공적으로 참가했습니다.
              </p>
              <p className="text-sm text-green-500 mt-2">
                {joinCooldown}초 후 자동으로 이동합니다...
              </p>
              <Button
                variant="outline"
                className="mt-4 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => {
                  if (successEventId) {
                    router.push(`/client/events/${successEventId}`)
                  }
                }}
              >
                바로 이동하기
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">이벤트 코드를 입력하세요</h2>
              <p className="text-gray-600">주최자에게 받은 6자리 코드를 입력해주세요</p>
            </>
          )}
        </div>

        {/* 코드 입력 필드들 */}
        {!joinSuccess && (
          <>
            <div className="flex justify-center gap-2">
              {eventCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                  disabled={isOnCooldown()}
                />
              ))}
            </div>

            {/* 참가 버튼 */}
            <div className="flex justify-center">
              <Button
                onClick={handleJoinByCode}
                disabled={joiningByCode || eventCode.some(digit => !digit) || isOnCooldown()}
                className="w-full max-w-xs bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                {joiningByCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    참가 중...
                  </>
                ) : isOnCooldown() ? (
                  `잠시 후 다시 시도 (${Math.ceil((5000 - (Date.now() - lastJoinTimeRef.current)) / 1000)}초)`
                ) : (
                  '이벤트 참가하기'
                )}
              </Button>
            </div>
          </>
        )}

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
                  className="flex items-center justify-between p-4 rounded-lg"
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

        {/* 쿨다운 안내 메시지 */}
        {joinCooldown > 0 && (
          <div className="text-center text-sm text-gray-500">
            <p>새로운 이벤트 참가는 {joinCooldown}초 후에 가능합니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}