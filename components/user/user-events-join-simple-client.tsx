// @ts-nocheck
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

      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('id,status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingParticipation) {
        if (existingParticipation.status === 'removed') {
          alert('관리자에 의해 내보내진 참가자는 이 이벤트에 다시 참가할 수 없습니다.')
          return
        } else {
          alert('이미 참가한 이벤트입니다.')
          router.push(`/client/events/${event.id}`)
          return
        }
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
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Animation Elements */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 px-5 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 -ml-2 text-white hover:text-white/80 hover:bg-white/10"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">이벤트 참가</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* 참가 방법 선택 */}
        <div className="px-5 py-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">이벤트 참가</h2>
                <p className="text-sm text-slate-400">QR 코드를 스캔하여 빠르게 참가하세요</p>
              </div>
              <Link href="/client/events/scan">
                <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-purple-300 hover:bg-slate-700 hover:text-white hover:border-purple-500/50 transition-all">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR 스캔
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 이벤트 코드 입력 섹션 */}
        <div className="px-5 pb-8 space-y-8">
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 ${
              joinSuccess ? 'bg-green-500/10 ring-1 ring-green-500/50' : 'bg-purple-500/10 ring-1 ring-purple-500/50'
            }`}>
              {joinSuccess ? (
                <CheckCircle className="w-10 h-10 text-green-400" />
              ) : (
                <Calendar className="w-10 h-10 text-purple-400" />
              )}
            </div>
          </div>

          {/* 제목과 설명 */}
          <div className="text-center">
            {joinSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-green-400 mb-2 drop-shadow-sm">참가 성공!</h2>
                <p className="text-slate-300">
                  이벤트에 성공적으로 참가했습니다.
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {joinCooldown}초 후 자동으로 이동합니다...
                </p>
                <Button
                  variant="outline"
                  className="mt-6 bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 w-full max-w-xs"
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
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">이벤트 코드를 입력하세요</h2>
                <p className="text-slate-400">주최자에게 받은 6자리 코드를 입력해주세요</p>
              </>
            )}
          </div>

          {/* 코드 입력 필드들 */}
          {!joinSuccess && (
            <>
              <div className="flex justify-center gap-2 sm:gap-3">
                {eventCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-900/80 border-2 border-slate-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none disabled:bg-slate-800 disabled:text-slate-600 text-white shadow-inner transition-all"
                    disabled={isOnCooldown()}
                  />
                ))}
              </div>

              {/* 참가 버튼 */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleJoinByCode}
                  disabled={joiningByCode || eventCode.some(digit => !digit) || isOnCooldown()}
                  className="w-full max-w-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-6 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {joiningByCode ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">최근 참가한 이벤트</h3>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => router.push(`/client/events/${event.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-purple-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-semibold text-white text-base truncate group-hover:text-purple-300 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(event.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 쿨다운 안내 메시지 */}
          {joinCooldown > 0 && (
            <div className="text-center text-sm text-slate-500 animate-pulse">
              <p>새로운 이벤트 참가는 {joinCooldown}초 후에 가능합니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
