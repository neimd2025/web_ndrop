// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { eventCollectionAPI, eventParticipantAPI, userProfileAPI, businessCardAPI } from '@/lib/supabase/database'
import Image from "next/image"

export default function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [participantsWithDetails, setParticipantsWithDetails] = useState<any[]>([])
  const [collectionStats, setCollectionStats] = useState<any>(null)
  const [collectionRanking, setCollectionRanking] = useState<any[]>([])
  const [hourlyTimeline, setHourlyTimeline] = useState<any[]>([])
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
      const participantsData = await eventParticipantAPI.getEventParticipants(eventId)
      
      const stats = await eventCollectionAPI.getEventCollectionStats(eventId)
      const ranking = await eventCollectionAPI.getEventCollectionRanking(eventId, 10)
      const hourlyData = await eventCollectionAPI.getEventCollectionTimeline(eventId, 'hour')

      setCollectionStats(stats)
      setCollectionRanking(ranking || [])
      setHourlyTimeline(hourlyData || [])

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

      setParticipants(participantsData)

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

  const BarChart = ({ data, title, color = 'blue', maxBars = 10 }: { data: Record<string, number>, title: string, color?: string, maxBars?: number }) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxBars)
    
    const maxValue = Math.max(...sortedData.map(([, value]) => value))
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500'
    }

    return (
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="space-y-3">
          {sortedData.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 w-32 truncate">{key}</span>
              <div className="flex items-center flex-1 max-w-64">
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
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


const HourlyChart = ({ data, title }: { data: Array<{date: string, count: number}>, title: string }) => {
  const maxValue = Math.max(...data.map(d => d.count))
  const labels = data.map(d => {
    const hour = d.date.split(' ')[1].split(':')[0]
    return `${hour}시`
  })
  const values = data.map(d => d.count)

  // 시간대별로 그룹화 (시간별이 아닌 시간대별)
  const hourlyGroups = Array.from({ length: 24 }, (_, hour) => {
    const hourData = data.filter(d => {
      const dHour = parseInt(d.date.split(' ')[1].split(':')[0])
      return dHour === hour
    })
    return {
      hour: `${hour}시`,
      count: hourData.reduce((sum, d) => sum + d.count, 0),
      rawHour: hour
    }
  })

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
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
                    className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                    style={{ 
                      height: `${group.count > 0 ? (group.count / Math.max(...hourlyGroups.map(g => g.count))) * 200 : 2}px`,
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
      
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{Math.max(...hourlyGroups.map(g => g.count))}</div>
            <div className="text-xs text-gray-500">최고 시간대</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {(hourlyGroups.reduce((a, b) => a + b.count, 0) / hourlyGroups.filter(g => g.count > 0).length || 1).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">시간대 평균</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {hourlyGroups.filter(g => g.count > 0).length}
            </div>
            <div className="text-xs text-gray-500">활동 시간대</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
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
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

  // 데이터를 비율 기준으로 정렬 (큰 비율부터)
  const sortedData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="flex flex-col items-center">
        {/* 도넛 차트 */}
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

        {/* 하단 레전드 */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedData.map(([key, value], index) => {
              const percentage = Math.round((value / total) * 100)
              return (
                <div 
                  key={key} 
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
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
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
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

const CollectionStatsCard = ({ stats }: { stats: any }) => {
  if (!stats) return null

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [filteredHourlyData, setFilteredHourlyData] = useState<any[]>([])

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

  // 선택된 날짜의 시간대별 데이터 필터링
  useEffect(() => {
    if (!selectedDate && eventDates.length > 0) {
      // 기본으로 첫째 날 선택
      setSelectedDate(eventDates[0].date)
    }
    
    if (selectedDate && hourlyTimeline.length > 0) {
      const filtered = hourlyTimeline.filter(item => {
        const itemDate = item.date.split(' ')[0] // "2024-01-01 14:00" → "2024-01-01"
        return itemDate === selectedDate
      })
      setFilteredHourlyData(filtered)
    }
  }, [selectedDate, hourlyTimeline, eventDates])

  // 선택된 날짜의 시간대별 최고 수집 정보 계산
  let peakHourlyInfo = null
  if (filteredHourlyData.length > 0) {
    // 시간별이 아니라 시간대별로 그룹화
    const hourlyGroups = Array.from({ length: 24 }, (_, hour) => {
      const hourData = filteredHourlyData.filter(d => {
        const dHour = parseInt(d.date.split(' ')[1].split(':')[0])
        return dHour === hour
      })
      return {
        hour: `${hour}시`,
        count: hourData.reduce((sum, d) => sum + d.count, 0),
        rawHour: hour
      }
    })
    
    const sortedHourly = [...hourlyGroups].sort((a, b) => b.count - a.count)
    if (sortedHourly.length > 0 && sortedHourly[0].count > 0) {
      peakHourlyInfo = {
        count: sortedHourly[0].count,
        hour: sortedHourly[0].hour,
        rawHour: sortedHourly[0].rawHour
      }
    }
  }

  // 선택된 날짜의 시간대별 활동 시간 계산
  const activeHours = filteredHourlyData.length > 0 
    ? Array.from(new Set(filteredHourlyData.map(d => {
        const hour = parseInt(d.date.split(' ')[1].split(':')[0])
        return hour
      }))).sort((a, b) => a - b)
    : []

  const activeHourRange = activeHours.length > 0
    ? `${activeHours[0]}시 ~ ${activeHours[activeHours.length - 1]}시`
    : '데이터 없음'

  // 선택된 날짜 표시용
  const selectedDateDisplay = eventDates.find(d => d.date === selectedDate)?.display || '날짜 선택'

  return (
    <div className="bg-gradient-to-br border border-blue-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-blue-800">📊 시간대별 카드 수집 통계</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {filteredHourlyData.reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-gray-600">일별 총 수집</div>
          <div className="text-xs text-gray-500 mt-1">선택한 날짜 기준</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {filteredHourlyData.length > 0 
              ? (filteredHourlyData.reduce((sum, d) => sum + d.count, 0) / filteredHourlyData.length).toFixed(1)
              : 0}
          </div>
          <div className="text-sm text-gray-600">시간대 평균</div>
          <div className="text-xs text-gray-500 mt-1">(카드/시간대)</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="text-3xl font-bold text-purple-600 mb-2">{peakHourlyInfo?.count || 0}</div>
          <div className="text-sm text-gray-600">최고 수집 시간대</div>
          <div className="text-xs text-gray-500 mt-1 truncate" title={peakHourlyInfo?.hour || ''}>
            {peakHourlyInfo?.hour || '데이터 없음'}
          </div>
        </div>
      </div>

      {filteredHourlyData.length > 0 ? (
        <div className="mt-4">
          <HourlyChart 
            data={filteredHourlyData} 
            title={`${selectedDateDisplay} 시간대별 카드 수집 추이`}
          />
        </div>
      ) : selectedDate ? (
        <div className="mt-8 text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">📊</div>
          <p className="text-gray-600">선택한 날짜의 데이터가 없습니다</p>
          <p className="text-sm text-gray-500 mt-1">다른 날짜를 선택해주세요</p>
        </div>
      ) : null}
    </div>
  )
}

  const RankingTable = ({ ranking }: { ranking: any[] }) => {
    if (ranking.length === 0) return null

    const medalColors = [
      'bg-yellow-100 text-yellow-800',
      'bg-gray-100 text-gray-800',
      'bg-orange-100 text-orange-800',
    ]

    const totalCollections = ranking.reduce((sum, r) => sum + r.collection_count, 0)
    const maxCount = ranking.length > 0 ? ranking[0].collection_count : 1

    return (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg text-gray-800">🏆 시간대별 카드 수집 랭킹 TOP 10</h3>
          <p className="text-sm text-gray-600 mt-1">이벤트 기간 동안 가장 많은 명함을 수집한 참가자들</p>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {ranking.map((item, index) => (
              <div key={item.user_id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  index < 3 ? medalColors[index] : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  <span className="font-bold text-lg">{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900 truncate max-w-[200px]" title={item.user_name}>
                      {item.user_name}
                    </div>
                    <div className="font-bold text-xl text-blue-600 ml-2">{item.collection_count}</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
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
          
          {/* 요약 통계 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCollections}</div>
                <div className="text-xs text-gray-500">총 수집량</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {ranking.length > 0 ? Math.round(totalCollections / ranking.length) : 0}
                </div>
                <div className="text-xs text-gray-500">참가자 평균</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
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
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="ndrop" width={40} height={40} />
              <div>
                <span className="text-xl font-bold text-gray-900">ndrop</span>
                <div className="text-xs text-gray-500">이벤트 분석 리포트</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">데이터를 분석하는 중...</p>
              <p className="text-gray-500 text-sm mt-2">참가자 정보와 시간대별 수집 통계를 불러오는 중입니다</p>
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl font-bold mb-2">{analytics?.totalParticipants || 0}</div>
                  <div className="text-blue-100">총 참가자</div>
                  <div className="text-xs text-blue-200 mt-2 opacity-80">이벤트 신청자 수</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl font-bold mb-2">{collectionStats?.total_collections || 0}</div>
                  <div className="text-green-100">총 수집 카드</div>
                  <div className="text-xs text-green-200 mt-2 opacity-80">이벤트 기간 동안</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex w-full space-x-1 bg-white rounded-xl p-1 border shadow-sm inline-flex">
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'participants' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    참가자 분석
                  </button>
                  <button
                    onClick={() => setActiveTab('collections')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'collections' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    수집 통계
                  </button>
                  <button
                    onClick={() => setActiveTab('ranking')}
                    className={`px-6 py-3 w-1/3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === 'ranking' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
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
                        color="green"
                        maxBars={4}
                      />
                    )}

                    {Object.keys(analytics.personalityKeywords).length > 0 && (
                      <BarChart 
                        data={analytics.personalityKeywords} 
                        title="🌟 성격 키워드 TOP 10" 
                        color="purple"
                      />
                    )}

                    {Object.keys(analytics.interests).length > 0 && (
                      <BarChart 
                        data={analytics.interests} 
                        title="🎯 관심사 TOP 10" 
                        color="orange"
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">참가자 상세 정보</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      {participantsWithDetails.map((participant, index) => (
                        <div key={participant.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
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
                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
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
                                  <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                                    {interest}
                                  </span>
                                ))}
                                {participant.user_profile?.hobby_keywords?.slice(0, 3).map((hobby: string, i: number) => (
                                  <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">
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
                </div>
              )}

              {activeTab === 'collections' && (
                <div className="space-y-8">
                  <CollectionStatsCard stats={collectionStats} />
                </div>
              )}

              {activeTab === 'ranking' && (
                <div className="space-y-8">
                  <RankingTable ranking={collectionRanking} />
                </div>
              )}
            </>
          )}

          {!loading && participantsWithDetails.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-600 mb-2">데이터가 없습니다</h2>
              <p className="text-gray-500">이 이벤트에는 아직 참가자가 없거나 데이터를 불러올 수 없습니다.</p>
              <button 
                onClick={() => resolvedParams?.id && loadEventData(resolvedParams.id)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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