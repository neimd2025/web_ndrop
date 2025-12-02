// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { eventCollectionAPI, eventParticipantAPI, userProfileAPI, businessCardAPI } from '@/lib/supabase/database'
import Image from "next/image"
import Link from 'next/link'

export default function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [participantsWithDetails, setParticipantsWithDetails] = useState<any[]>([])
  const [collectionStats, setCollectionStats] = useState<any>(null)
  const [overallRanking, setOverallRanking] = useState<any[]>([])
  const [allHourlyTimeline, setAllHourlyTimeline] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'participants' | 'collections' | 'ranking'>('participants')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  const analyzeData = (participants: any[]) => {
    if (participants.length === 0) return null

    const analytics = {
      totalParticipants: participants.length,
      hasProfile: participants.filter(p => p.user_profile).length,
      hasBusinessCard: participants.filter(p => p.business_card).length,
      hasBoth: participants.filter(p => p.user_profile && p.business_card).length,
      mbtiDistribution: {} as Record<string, number>,
      personalityKeywords: {} as Record<string, number>,
      interests: {} as Record<string, number>,
      workFields: {} as Record<string, number>,
      hobbies: {} as Record<string, number>,
      affiliationTypes: {} as Record<string, number>,
      ageGroups: {
        '20대 초반': 0,
        '20대 중반': 0,
        '20대 후반': 0,
        '30대 이상': 0
      }
    }

    participants.forEach(participant => {
      const profile = participant.user_profile
      const businessCard = participant.business_card

      const mbti = profile?.mbti || businessCard?.mbti
      if (mbti) {
        analytics.mbtiDistribution[mbti] = (analytics.mbtiDistribution[mbti] || 0) + 1
      }

      const personalityKeywords = profile?.personality_keywords || businessCard?.personality_keywords || []
      personalityKeywords.forEach((keyword: string) => {
        analytics.personalityKeywords[keyword] = (analytics.personalityKeywords[keyword] || 0) + 1
      })

      const interests = profile?.interest_keywords || businessCard?.interest_keywords || []
      interests.forEach((interest: string) => {
        analytics.interests[interest] = (analytics.interests[interest] || 0) + 1
      })

      const workField = profile?.work_field || businessCard?.work_field
      if (workField) {
        analytics.workFields[workField] = (analytics.workFields[workField] || 0) + 1
      }

      const hobbies = profile?.hobby_keywords || businessCard?.hobby_keywords || []
      hobbies.forEach((hobby: string) => {
        analytics.hobbies[hobby] = (analytics.hobbies[hobby] || 0) + 1
      })

      const affiliationType = profile?.affiliation_type
      if (affiliationType) {
        analytics.affiliationTypes[affiliationType] = (analytics.affiliationTypes[affiliationType] || 0) + 1
      }

      if (profile?.birth_date) {
        const birthYear = new Date(profile.birth_date).getFullYear()
        const age = new Date().getFullYear() - birthYear
        
        if (age >= 20 && age < 23) analytics.ageGroups['20대 초반']++
        else if (age >= 23 && age < 26) analytics.ageGroups['20대 중반']++
        else if (age >= 26 && age < 30) analytics.ageGroups['20대 후반']++
        else if (age >= 30) analytics.ageGroups['30대 이상']++
      }
    })

    return analytics
  }

  const loadEventData = async (eventId: string) => {
    setLoading(true)

    try {
      // 1. 참가자 데이터 로드
      const participantsData = await eventParticipantAPI.getEventParticipants(eventId)
      
      // 2. 통계 데이터 로드
      const stats = await eventCollectionAPI.getEventCollectionStats(eventId)
      
      // 3. 전체 기간 랭킹 데이터 로드
      const ranking = await eventCollectionAPI.getEventCollectionRanking(eventId, 10)
      
      // 4. 전체 시간대 데이터 로드 - 'hour'로 명시적 호출
      const hourlyData = await eventCollectionAPI.getEventCollectionTimeline(eventId, 'hour')

      console.log('📊 시간대별 데이터:', hourlyData)
      console.log('📊 통계 데이터:', stats)
      console.log('📊 랭킹 데이터:', ranking)

      setCollectionStats(stats)
      setOverallRanking(ranking || [])
      setAllHourlyTimeline(hourlyData || [])

      // 5. 참가자 상세 정보 로드
      if (participantsData.length > 0) {
        const participantsWithFullDetails = []
        
        for (const participant of participantsData) {
          const userId = participant.user_id
          
          let userProfile = null
          let businessCard = null
          
          try {
            userProfile = await userProfileAPI.getUserProfile(userId)
          } catch (error) {
            console.error('유저 프로필 조회 실패:', error)
          }
          
          try {
            businessCard = await businessCardAPI.getUserBusinessCard(userId)
          } catch (error) {
            console.error('비즈니스 카드 조회 실패:', error)
          }

          participantsWithFullDetails.push({
            ...participant,
            user_profile: userProfile,
            business_card: businessCard
          })
        }

        setParticipantsWithDetails(participantsWithFullDetails)
        
        const analyticsData = analyzeData(participantsWithFullDetails)
        setAnalytics(analyticsData)
      }

    } catch (error) {
      console.error('API 호출 에러:', error)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (resolvedParams?.id) {
      loadEventData(resolvedParams.id)
    }
  }, [resolvedParams])

  // 공통 차트 컴포넌트들
  const BarChart = ({ data, title, color = 'primary', maxBars = 10 }: { data: Record<string, number>, title: string, color?: string, maxBars?: number }) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxBars)
    
    const maxValue = Math.max(...sortedData.map(([, value]) => value))
    const colorClasses = {
      primary: 'bg-[#9464EE]',
      light: 'bg-[#AD82FC]',
      dark: 'bg-[#793CE9]',
      accent: 'bg-[#F1ECFA]',
      blue: 'bg-blue-500',
      green: 'bg-green-500'
    }

    return (
      <div className="bg-white p-6 rounded-xl border border-[#F1ECFA] shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="space-y-3">
          {sortedData.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 w-32 truncate">{key}</span>
              <div className="flex items-center flex-1 max-w-64">
                <div className="w-full bg-[#F1ECFA] rounded-full h-4 overflow-hidden">
                  <div 
                    className={`${colorClasses[color]} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium ml-3 w-10 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 시간대별 차트 컴포넌트
  const HourlyChart = ({ data, title }: { data: Array<{date: string, count: number}>, title: string }) => {
    // 데이터가 없는 경우
    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-6 rounded-xl border border-[#F1ECFA] shadow-sm">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">📊</div>
            <p className="text-gray-500">데이터가 없습니다</p>
          </div>
        </div>
      )
    }

    // 현재 날짜의 데이터만 필터링 (이미 API에서 모든 시간대 포함)
    const today = data

    // 시간대별로 그룹화 (24시간)
    const hourlyGroups = Array.from({ length: 24 }, (_, hour) => {
      const hourStr = hour.toString().padStart(2, '0')
      // 현재 날짜의 해당 시간대 데이터 찾기
      const hourData = today.filter(item => {
        const hourFromData = item.date.split(' ')[1]?.split(':')[0]
        return hourFromData === hourStr
      })
      return {
        hour: `${hour}시`,
        count: hourData.reduce((sum, d) => sum + d.count, 0),
        rawHour: hour
      }
    })

    const maxCount = Math.max(...hourlyGroups.map(g => g.count), 1)

    return (
      <div className="bg-white p-6 rounded-xl border border-[#F1ECFA] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end">
            <div className="flex-1 flex items-end justify-between overflow-x-auto px-2">
              {hourlyGroups.map((group, index) => (
                <div key={index} className="flex flex-col items-center px-1">
                  <div className="relative group">
                    <div 
                      className="w-8 bg-gradient-to-t from-[#793CE9] to-[#AD82FC] rounded-t-lg transition-all duration-300 hover:from-[#9464EE] hover:to-[#AD82FC]"
                      style={{ 
                        height: `${(group.count / maxCount) * 200}px`,
                        minWidth: '24px' 
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {group.hour}: {group.count}개
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 truncate">{group.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#F1ECFA]">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-[#793CE9]">{Math.max(...hourlyGroups.map(g => g.count))}</div>
              <div className="text-xs text-gray-500">최고 시간대</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#9464EE]">
                {(hourlyGroups.reduce((a, b) => a + b.count, 0) / 24).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">시간대 평균</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#AD82FC]">
                {hourlyGroups.filter(g => g.count > 0).length}
              </div>
              <div className="text-xs text-gray-500">활동 시간대</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#793CE9]">
                {hourlyGroups.reduce((a, b) => a + b.count, 0)}
              </div>
              <div className="text-xs text-gray-500">시간대 총계</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const DonutChart = ({ data, title }: { data: Record<string, number>, title: string }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0)
    if (total === 0) return null

    const colors = ['#9464EE', '#E9B0A8', '#E9B690']
const sortedData = Object.entries(data)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 3); // 🔥 top 3만 사용

    return (
      <div className="bg-white p-6 rounded-xl border border-[#F1ECFA] shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {sortedData.map(([key], index) => {
                const percentage = (data[key] / total) * 100
                const startAngle = index === 0 ? 0 : 
                  sortedData.slice(0, index).reduce((sum, [k]) => sum + (data[k] / total) * 360, 0)
                const endAngle = startAngle + (percentage / 100) * 360

                const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
                const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
                const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
                const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)

                const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                return (
                  <path
                    key={key}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={colors[index % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold block text-gray-800">{total}</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedData.map(([key, value], index) => {
                const percentage = Math.round((value / total) * 100)
                return (
                  <div 
                    key={key} 
                    className="flex items-center p-3 hover:bg-[#F1ECFA] rounded-lg transition-colors border border-[#F1ECFA]"
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-700 truncate text-sm">{key}</div>
                        <div className="font-bold text-gray-800 ml-2">{value}</div>
                      </div>
                      <div className="w-full bg-[#F1ECFA] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 수집 통계 카드
  const CollectionStatsCard = ({ stats }: { stats: any }) => {
    const [selectedDate, setSelectedDate] = useState<string>('')

    // 이벤트 기간 내의 모든 날짜 추출
    const eventDates = useMemo(() => {
      if (!stats) return []
      
      const start = new Date(stats.event_start_date)
      const end = new Date(stats.event_end_date)
      const dates = []
      
      const current = new Date(start)
      while (current <= end) {
        dates.push({
          date: current.toISOString().split('T')[0],
          display: current.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
        })
        current.setDate(current.getDate() + 1)
      }
      
      return dates
    }, [stats])

    // 선택된 날짜가 없으면 첫 번째 날짜로 설정
    useEffect(() => {
      if (!selectedDate && eventDates.length > 0) {
        setSelectedDate(eventDates[0].date)
      }
    }, [selectedDate, eventDates])

    // 선택된 날짜의 데이터 필터링
    const filteredHourlyData = useMemo(() => {
      if (!selectedDate || allHourlyTimeline.length === 0) return []
      
      return allHourlyTimeline.filter(item => {
        const itemDate = item.date.split(' ')[0]
        return itemDate === selectedDate
      })
    }, [selectedDate, allHourlyTimeline])

    // 선택된 날짜의 총 수집량
    const dailyTotal = useMemo(() => 
      filteredHourlyData.reduce((sum, d) => sum + d.count, 0), 
      [filteredHourlyData]
    )

    const selectedDateDisplay = eventDates.find(d => d.date === selectedDate)?.display || '날짜 선택'

    return (
      <div className="bg-gradient-to-br bg-white border border-[#F1ECFA] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-[#793CE9]">📊 시간대별 카드 수집 통계</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs text-gray-600 bg-white border border-[#F1ECFA] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9464EE] focus:border-transparent"
              >
                <option value="">날짜 선택</option>
                {eventDates.map((date) => (
                  <option key={date.date} value={date.date}>
                    {date.display}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-4 border border-[#F1ECFA] shadow-sm">
            <div className="text-3xl font-bold text-[#793CE9] mb-2">
              {dailyTotal}
            </div>
            <div className="text-sm text-gray-600">일별 총 수집</div>
            <div className="text-xs text-gray-500 mt-1">선택한 날짜 기준</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-[#F1ECFA] shadow-sm">
            <div className="text-3xl font-bold text-[#9464EE] mb-2">
              {dailyTotal > 0 ? (dailyTotal / 24).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">시간대 평균</div>
            <div className="text-xs text-gray-500 mt-1">(카드/시간대)</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-[#F1ECFA] shadow-sm">
            <div className="text-3xl font-bold text-[#AD82FC] mb-2">
              {Math.max(...filteredHourlyData.map(d => d.count), 0)}
            </div>
            <div className="text-sm text-gray-600">최고 수집 시간대</div>
            <div className="text-xs text-gray-500 mt-1">
              {filteredHourlyData.length > 0 ? 
                `${filteredHourlyData.reduce((max, d) => d.count > max.count ? d : max).date.split(' ')[1]}` : 
                '데이터 없음'}
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-4">
            <HourlyChart 
              data={filteredHourlyData} 
              title={`${selectedDateDisplay} 시간대별 카드 수집 추이`}
            />
          </div>
        )}
      </div>
    )
  }

  // 전체 기간 랭킹 테이블
  const RankingTable = ({ ranking }: { ranking: any[] }) => {
    if (!ranking || ranking.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-[#F1ECFA] shadow-sm p-6">
          <h3 className="font-bold text-lg text-[#793CE9] mb-4">🏆 전체 기간 카드 수집 랭킹</h3>
          <div className="text-center py-12">
            <p className="text-gray-500">아직 수집 데이터가 없습니다</p>
          </div>
        </div>
      )
    }

    const totalCollections = ranking.reduce((sum, r) => sum + r.collection_count, 0)
    const maxCount = ranking.length > 0 ? ranking[0].collection_count : 1

    return (
      <div className="bg-white rounded-xl border border-[#F1ECFA] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#F1ECFA]">
          <h3 className="font-bold text-lg text-[#793CE9]">🏆 전체 기간 카드 수집 랭킹 TOP 10</h3>
          <p className="text-sm text-gray-600 mt-1">이벤트 전체 기간 동안 가장 많은 명함을 수집한 참가자들</p>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {ranking.map((item, index) => (
              <div key={item.user_id || index} className="flex items-center p-4 hover:bg-[#F1ECFA] rounded-lg transition-colors border border-[#F1ECFA]">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  index < 3 ? 
                    index === 0 ? 'bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]' :
                    index === 1 ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                    'bg-[#F8D7DA] text-[#721C24] border border-[#F5C6CB]' : 
                    'bg-[#F1ECFA] text-[#793CE9] border border-[#F1ECFA]'
                }`}>
                  <span className="font-bold text-lg">{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900 truncate max-w-[200px]" title={item.user_name}>
                      {item.user_name || `참가자 ${index + 1}`}
                    </div>
                    <div className="font-bold text-xl text-[#793CE9] ml-2">{item.collection_count}</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-[#F1ECFA] rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#793CE9] to-[#AD82FC] h-full rounded-full"
                          style={{ 
                            width: `${Math.min(100, (item.collection_count / maxCount) * 100)}%` 
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 w-12 text-right">
                        {totalCollections > 0 ? Math.round((item.collection_count / totalCollections) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-[#F1ECFA]">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#793CE9]">{totalCollections}</div>
                <div className="text-xs text-gray-500">총 수집량</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#9464EE]">
                  {ranking.length > 0 ? Math.round(totalCollections / ranking.length) : 0}
                </div>
                <div className="text-xs text-gray-500">참가자 평균</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#AD82FC]">
                  {ranking.length > 0 ? ranking[0].collection_count : 0}
                </div>
                <div className="text-xs text-gray-500">1위 수집량</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!resolvedParams?.id) {
    return <div>이벤트 ID를 찾을 수 없습니다.</div>
  }

  return (
    <>
<div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Link href="/admin" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
        <Image src="/images/logo.png" alt="ndrop" width={40} height={40} />
        <div>
          <span className="text-xl font-bold text-[#793CE9]">ndrop</span>
          <div className="text-xs text-gray-700">이벤트 분석 리포트</div>
        </div>
      </Link>
    </div>
  </div>
</div>

      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#793CE9] mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">데이터를 분석하는 중...</p>
              <p className="text-gray-500 text-sm mt-2">참가자 정보와 시간대별 수집 통계를 불러오는 중입니다</p>
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br border border-[#9464EE] bg-white text-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl text-[#9464EE] font-bold mb-2">{analytics?.totalParticipants || 0}</div>
                  <div className="text-gray-800">총 참가자</div>
                  <div className="text-xs text-gray-700 mt-2">이벤트 신청자 수</div>
                </div>
                <div className="bg-gradient-to-br border border-[#9464EE] bg-white text-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl text-[#9464EE] font-bold mb-2">{collectionStats?.total_collections || 0}</div>
                  <div className="text-gray-800">총 수집 카드</div>
                  <div className="text-xs text-gray-700 mt-2">이벤트 기간 동안</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex w-full space-x-1 bg-white rounded-xl p-1 border border-[#F1ECFA] shadow-sm inline-flex">
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'participants' 
                        ? 'bg-[#793CE9] text-white shadow-md' 
                        : 'text-gray-600 hover:text-[#793CE9] hover:bg-[#F1ECFA]'
                    }`}
                  >
                    참가자 분석
                  </button>
                  <button
                    onClick={() => setActiveTab('collections')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'collections' 
                        ? 'bg-[#793CE9] text-white shadow-md' 
                        : 'text-gray-600 hover:text-[#793CE9] hover:bg-[#F1ECFA]'
                    }`}
                  >
                    수집 통계
                  </button>
                  <button
                    onClick={() => setActiveTab('ranking')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'ranking' 
                        ? 'bg-[#793CE9] text-white shadow-md' 
                        : 'text-gray-600 hover:text-[#793CE9] hover:bg-[#F1ECFA]'
                    }`}
                  >
                    랭킹 보드
                  </button>
                </div>
              </div>

              {activeTab === 'participants' && analytics && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {Object.keys(analytics.mbtiDistribution).length > 0 && (
                      <DonutChart 
                        data={analytics.mbtiDistribution} 
                        title="🧠 MBTI 분포" 
                      />
                    )}

                    {Object.values(analytics.ageGroups).some(val => val > 0) && (
                      <BarChart 
                        data={analytics.ageGroups} 
                        title="🎂 연령대 분포" 
                        color="primary"
                        maxBars={4}
                      />
                    )}

                    {Object.keys(analytics.personalityKeywords).length > 0 && (
                      <BarChart 
                        data={analytics.personalityKeywords} 
                        title="🌟 성격 키워드 TOP 10" 
                        color="light"
                      />
                    )}

                    {Object.keys(analytics.interests).length > 0 && (
                      <BarChart 
                        data={analytics.interests} 
                        title="🎯 관심사 TOP 10" 
                        color="dark"
                      />
                    )}
                  </div>

                  {participantsWithDetails.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-[#793CE9]">참가자 상세 정보</h2>
                      <div className="grid grid-cols-1 gap-6">
                        {participantsWithDetails.slice(0, 10).map((participant, index) => (
                          <div key={participant.id || index} className="bg-white border border-[#F1ECFA] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                  <span className="bg-[#F1ECFA] text-[#793CE9] px-3 py-1 rounded-full text-sm">
                                    #{index + 1}
                                  </span>
                                  {participant.user_profile?.full_name || '이름 없음'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {participant.user_profile?.email || '이메일 없음'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {participant.user_profile?.mbti && (
                                  <span className="bg-[#F1ECFA] text-[#793CE9] px-3 py-1 rounded-full text-sm font-medium">
                                    {participant.user_profile.mbti}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2 text-sm">관심사 & 취미</h4>
                                <div className="flex flex-wrap gap-2">
                                  {participant.user_profile?.interest_keywords?.slice(0, 5).map((interest: string, i: number) => (
                                    <span key={i} className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs">
                                      {interest}
                                    </span>
                                  ))}
                                  {participant.user_profile?.hobby_keywords?.slice(0, 3).map((hobby: string, i: number) => (
                                    <span key={i} className="bg-[#FFF3E0] text-[#E65100] px-3 py-1 rounded-full text-xs">
                                      {hobby}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">직무:</span>
                                  <span className="ml-2 text-gray-600">
                                    {participant.user_profile?.work_field || '미기재'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">소속:</span>
                                  <span className="ml-2 text-gray-600">
                                    {participant.user_profile?.affiliation_type || '미소속'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'collections' && (
                <div className="space-y-8">
                  <CollectionStatsCard stats={collectionStats} />
                </div>
              )}

              {activeTab === 'ranking' && (
                <div className="space-y-8">
                  <RankingTable ranking={overallRanking} />
                </div>
              )}
            </>
          )}

          {!loading && participantsWithDetails.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-[#F1ECFA] shadow-sm">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-[#793CE9] mb-2">데이터가 없습니다</h2>
              <p className="text-gray-500">이 이벤트에는 아직 참가자가 없거나 데이터를 불러올 수 없습니다.</p>
              <button 
                onClick={() => resolvedParams?.id && loadEventData(resolvedParams.id)}
                className="mt-4 bg-[#793CE9] text-white px-6 py-2 rounded-lg hover:bg-[#9464EE] transition-colors"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}