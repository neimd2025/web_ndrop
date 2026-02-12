"use client"

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { businessCardAPI, collectedCardAPI } from '@/lib/supabase/database'
import { UserEvent, UserNotification, UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { Calendar, Camera, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { NotificationBell } from "./notification-bell"
import { cn } from "@/lib/utils"

interface UserHomeClientProps {
  user?: UserProfile
  upcomingEvents?: UserEvent[]
  recentNotifications?: UserNotification[]
  businessCardStats?: {
    totalViews: number
    totalShares: number
    publicCards: number
  }
}

export function UserHomeClient({
  user: initialUser,
  upcomingEvents: initialEvents,
  recentNotifications: initialNotifications,
  businessCardStats: initialStats
}: UserHomeClientProps = {}) {
  const { profile } = useUserProfile()
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [events, setEvents] = useState<UserEvent[]>(initialEvents || [])
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications || [])
  const [businessCardStats, setBusinessCardStats] = useState(initialStats || { totalViews: 0, totalShares: 0, publicCards: 0 })
  const [userCard, setUserCard] = useState<any>(null)
  const [collectedCards, setCollectedCards] = useState<any[]>([])
  
  // useAuth hooks with loading state
  const { profile: authUser, loading: authLoading, initialized: authInitialized } = useAuth('user')
  
  // Loading state management
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialUser) return false
    return true
  })
  
  const [activeTab, setActiveTab] = useState<'진행중' | '예정' | '종료'>('진행중')

  // Auth & Initial Data Loading Effect
  useEffect(() => {
    // 1. If props provided, use them.
    if (initialUser) {
      setLoading(false)
      return
    }

    // 2. Wait for auth to initialize
    if (authLoading || !authInitialized) {
      return
    }

    // 3. Auth finished. Check user.
    if (authUser) {
      // User found. Update local state.
      // This will trigger the next useEffect (dependent on user?.id) to load data.
      setUser(authUser as any)
    } else {
      // No user found (not logged in). Stop loading to show "Login required".
      setLoading(false)
    }
  }, [initialUser, authUser, authLoading, authInitialized])

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
    if (!user?.id) return

    try {
      // 사용자가 실제로 참가한 이벤트만 가져오기
      const supabase = createClient()

      const { data: participations, error } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            max_participants,
            current_participants,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      if (error) {
        console.error('참가 이벤트 조회 오류:', error)
        setEvents([])
        return
      }

      // 이벤트 데이터 추출 및 상태 계산
      const userEvents = participations?.map(participation => {
        const event = (participation as any).events
        if (!event) return null

        // 이벤트 상태 계산
        const now = new Date()
        const startDate = new Date(event.start_date)
        const endDate = new Date(event.end_date)

        let status = 'upcoming'
        if (now >= startDate && now < endDate) {
          status = 'ongoing'
        } else if (now >= endDate) {
          status = 'completed'
        }

        return {
          ...event,
          status
        }
      }).filter(Boolean) || []

      setEvents(userEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
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

  // 실시간 이벤트 참가 감지
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()

    // event_participants 테이블 변경 감지
    const channel = supabase
      .channel('event_participants_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_participants',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('새로운 이벤트 참가 감지:', payload)
          // 이벤트 목록 새로고침
          loadEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-[0_0_20px_rgba(124,58,237,0.5)]">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              ndrop
            </h1>
            <p className="text-gray-400">
              로딩 중...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-400">
            홈페이지를 보려면 로그인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative text-white pb-20 overflow-x-hidden">
      {/* Background Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-0 left-[10%] w-[1px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[120px] bg-gradient-to-b from-transparent via-blue-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "8s" }}></div>
        
        {/* Twinkling Stars Effect */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className={`absolute rounded-full bg-white animate-twinkle ${i % 3 === 0 ? 'w-1 h-1' : i % 3 === 1 ? 'w-0.5 h-0.5' : 'w-1.5 h-1.5'}`}
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10">
        {/* 헤더 섹션 */}
        <div className="px-5 pt-10 pb-2">
          <div className="flex items-center justify-between mb-6">
            {/* 프로필 아바타 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-400/30">
                <span className="text-white font-bold text-lg">{getInitial()}</span>
              </div>
              {/* 환영 메시지 */}
              <div>
                <h1 className="text-xl font-bold text-white">
                  안녕하세요, {getDisplayName()}님!
                </h1>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  오늘도 좋은 만남이 있기를 <Sparkles className="w-3 h-3 text-yellow-300" />
                </p>
              </div>
            </div>
            <NotificationBell user={user || undefined} />
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-3 mt-4">
            <Link href="/client/scan-card" className="flex-1">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] border border-purple-500/30 hover:scale-[1.02] transition-transform h-[100px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-1 backdrop-blur-sm">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold">명함 스캔</span>
              </div>
            </Link>

            <Link href="/client/events/join" className="flex-1">
              <div className="bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors h-[100px] hover:scale-[1.02] transition-transform">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-1">
                  <Calendar className="w-5 h-5 text-gray-300" />
                </div>
                <span className="text-sm font-semibold text-gray-200">행사참가</span>
              </div>
            </Link>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="px-5 py-4 space-y-6">
          {/* 내 명함 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                내 명함
              </h2>
              <Link 
                href="/client/my-qr" 
                className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20"
              >
                QR코드 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <Link href={`/card-books/${userCard?.id}`}>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-purple-500/50 transition-colors">
                    {profile?.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">{getInitial()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{getDisplayName()}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {userCard?.job_title && userCard?.company
                        ? `${userCard.job_title} / ${userCard.company}`
                        : userCard?.work_field
                          ? userCard.work_field
                          : '프로필을 완성해주세요'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          </div>

          {/* 내 이벤트 참가 기록 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-white">내 이벤트</h2>
              <Link 
                href="/client/events/history"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                전체보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              {/* 토글 버튼들 */}
              <div className="flex p-1 gap-1 border-b border-white/5 bg-black/20">
                {(['진행중', '예정', '종료'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 이벤트 목록 */}
              <div className="p-5">
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
                    <div className="space-y-3">
                      {filteredEvents.map((event) => (
                        <div key={event.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white text-sm line-clamp-1">{event.title}</h4>
                            <Badge className={`text-[10px] px-2 py-0.5 border-0 ${
                              activeTab === '진행중' ? 'bg-green-500/20 text-green-300' :
                              activeTab === '예정' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {activeTab}
                            </Badge>
                          </div>

                          <div className="space-y-1 mb-3">
                            <p className="text-xs text-gray-400">
                              {new Date(event.start_date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Link 
                              href={`/client/events/${event.id}?tab=info`} 
                              className="flex-1 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors border border-white/5"
                            >
                              상세정보
                            </Link>
                            <Link 
                              href={`/client/events/${event.id}?tab=networking`} 
                              className="flex-1 h-8 flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white transition-colors shadow-lg shadow-purple-900/20"
                            >
                              네트워킹
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        {activeTab} 이벤트가 없습니다
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
