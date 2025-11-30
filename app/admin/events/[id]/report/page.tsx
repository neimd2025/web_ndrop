// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { eventParticipantAPI, userProfileAPI, businessCardAPI } from '@/lib/supabase/database'

export default function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [participantsWithDetails, setParticipantsWithDetails] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // params를 resolve하는 useEffect
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  // 데이터 분석 함수
  const analyzeData = (participants: any[]) => {
    if (participants.length === 0) return null

    const analytics = {
      // 기본 통계
      totalParticipants: participants.length,
      hasProfile: participants.filter(p => p.user_profile).length,
      hasBusinessCard: participants.filter(p => p.business_card).length,
      hasBoth: participants.filter(p => p.user_profile && p.business_card).length,

      // MBTI 분석
      mbtiDistribution: {} as Record<string, number>,
      
      // 성격 키워드 분석
      personalityKeywords: {} as Record<string, number>,
      
      // 관심사 분석
      interests: {} as Record<string, number>,
      
      // 직무 분야 분석
      workFields: {} as Record<string, number>,
      
      // 취미 분석
      hobbies: {} as Record<string, number>,
      
      // 소속 유형 분석
      affiliationTypes: {} as Record<string, number>,

      // 나이대 분석
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

      // MBTI 분석
      const mbti = profile?.mbti || businessCard?.mbti
      if (mbti) {
        analytics.mbtiDistribution[mbti] = (analytics.mbtiDistribution[mbti] || 0) + 1
      }

      // 성격 키워드 분석
      const personalityKeywords = profile?.personality_keywords || businessCard?.personality_keywords || []
      personalityKeywords.forEach((keyword: string) => {
        analytics.personalityKeywords[keyword] = (analytics.personalityKeywords[keyword] || 0) + 1
      })

      // 관심사 분석
      const interests = profile?.interest_keywords || businessCard?.interest_keywords || []
      interests.forEach((interest: string) => {
        analytics.interests[interest] = (analytics.interests[interest] || 0) + 1
      })

      // 직무 분야 분석
      const workField = profile?.work_field || businessCard?.work_field
      if (workField) {
        analytics.workFields[workField] = (analytics.workFields[workField] || 0) + 1
      }

      // 취미 분석
      const hobbies = profile?.hobby_keywords || businessCard?.hobby_keywords || []
      hobbies.forEach((hobby: string) => {
        analytics.hobbies[hobby] = (analytics.hobbies[hobby] || 0) + 1
      })

      // 소속 유형 분석
      const affiliationType = profile?.affiliation_type
      if (affiliationType) {
        analytics.affiliationTypes[affiliationType] = (analytics.affiliationTypes[affiliationType] || 0) + 1
      }

      // 나이대 분석
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

  const testAPIs = async (eventId: string) => {
    setLoading(true)

    try {
      // 1. 참가자 목록 가져오기
      const participantsData = await eventParticipantAPI.getEventParticipants(eventId)
      
      if (participantsData.length > 0) {
        // 2. 상세 정보 가져오기
        const participantsWithFullDetails = []
        
        for (const participant of participantsData) {
          const userId = participant.user_id
          
          let userProfile = null
          let businessCard = null
          
          // 유저 프로필 조회
          try {
            userProfile = await userProfileAPI.getUserProfile(userId)
          } catch (error) {
            console.error('유저 프로필 조회 실패:', error)
          }
          
          // 비즈니스 카드 조회
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
        
        // 데이터 분석 실행
        const analyticsData = analyzeData(participantsWithFullDetails)
        setAnalytics(analyticsData)
        
        // 콘솔에 상세 정보 출력
        console.log('=== 이벤트 참가자 상세 데이터 ===', participantsWithFullDetails)
        console.log('=== 데이터 분석 결과 ===', analyticsData)
      }

      setParticipants(participantsData)

    } catch (error) {
      console.error('API 호출 에러:', error)
    }

    setLoading(false)
  }

  // resolvedParams가 있을 때 API 호출
  useEffect(() => {
    if (resolvedParams?.id) {
      testAPIs(resolvedParams.id)
    }
  }, [resolvedParams])

  // 차트 컴포넌트들
  const BarChart = ({ data, title, color = 'blue' }: { data: Record<string, number>, title: string, color?: string }) => {
    const maxValue = Math.max(...Object.values(data))
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    }

    return (
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 w-32 truncate">{key}</span>
              <div className="flex items-center flex-1 max-w-48">
                <div 
                  className={`${colorClasses[color]} h-6 rounded-l transition-all duration-500`}
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
                <span className="text-xs font-medium ml-2 w-8">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const DonutChart = ({ data, title }: { data: Record<string, number>, title: string }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0)
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']

    return (
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="flex items-center">
          <div className="relative w-32 h-32 mr-4">
            <svg viewBox="0 0 100 100" className="w-32 h-32">
              {Object.entries(data).map(([key], index) => {
                const percentage = (data[key] / total) * 100
                const startAngle = index === 0 ? 0 : 
                  Object.values(data).slice(0, index).reduce((sum, value) => sum + (value / total) * 360, 0)
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
              <span className="text-lg font-bold">{total}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              {Object.entries(data).map(([key, value], index) => (
                <div key={key} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-600 flex-1">{key}</span>
                  <span className="text-sm font-medium">{value}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((value / total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ParticipantCard = ({ participant, index }: { participant: any, index: number }) => {
    const profile = participant.user_profile
    const businessCard = participant.business_card

    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              #{index + 1}
            </span>
            {profile?.full_name || '이름 없음'}
          </h3>
          <div className="flex gap-2">
            {profile?.mbti && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                {profile.mbti}
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              participant.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {participant.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-700">기본 정보</h4>
            <div className="space-y-2 text-sm">
              <p><strong>이메일:</strong> {profile?.email || '없음'}</p>
              <p><strong>생년월일:</strong> {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '없음'}</p>
              <p><strong>소속:</strong> {profile?.affiliation_type || '미소속'}</p>
              <p><strong>직무:</strong> {profile?.work_field || businessCard?.work_field || '없음'}</p>
            </div>
          </div>

          {/* 성격 및 관심사 */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-700">성격 & 관심사</h4>
            <div className="space-y-2">
              {profile?.personality_keywords?.length > 0 && (
                <div>
                  <strong className="text-sm">성격:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.personality_keywords.map((keyword: string, i: number) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.interest_keywords?.length > 0 && (
                <div>
                  <strong className="text-sm">관심사:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.interest_keywords.map((interest: string, i: number) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.hobby_keywords?.length > 0 && (
                <div>
                  <strong className="text-sm">취미:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.hobby_keywords.map((hobby: string, i: number) => (
                      <span key={i} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 자기소개 */}
        {profile?.introduction && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2 text-gray-700">자기소개</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{profile.introduction}</p>
          </div>
        )}
      </div>
    )
  }

  if (!resolvedParams?.id) {
    return <div>이벤트 ID를 찾을 수 없습니다.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">이벤트 참가자 분석 리포트</h1>
      <p className="text-gray-600 mb-6">이벤트 ID: {resolvedParams.id}</p>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">데이터를 분석하는 중...</p>
        </div>
      )}

      {!loading && analytics && (
        <div className="space-y-8">
          {/* 개요 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold mb-2">{analytics.totalParticipants}</div>
              <div className="text-blue-100">총 참가자</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold mb-2">{analytics.hasProfile}</div>
              <div className="text-green-100">프로필 보유</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold mb-2">{analytics.hasBusinessCard}</div>
              <div className="text-purple-100">명함 보유</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold mb-2">{analytics.hasBoth}</div>
              <div className="text-orange-100">완전한 정보</div>
            </div>
          </div>

          {/* 분석 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MBTI 분포 */}
            {Object.keys(analytics.mbtiDistribution).length > 0 && (
              <DonutChart 
                data={analytics.mbtiDistribution} 
                title="🧠 MBTI 분포" 
              />
            )}

            {/* 나이대 분포 */}
            {Object.values(analytics.ageGroups).some(val => val > 0) && (
              <BarChart 
                data={analytics.ageGroups} 
                title="🎂 연령대 분포" 
                color="green"
              />
            )}

            {/* 성격 키워드 */}
            {Object.keys(analytics.personalityKeywords).length > 0 && (
              <BarChart 
                data={analytics.personalityKeywords} 
                title="🌟 성격 키워드" 
                color="purple"
              />
            )}

            {/* 관심사 분포 */}
            {Object.keys(analytics.interests).length > 0 && (
              <BarChart 
                data={analytics.interests} 
                title="🎯 관심사 분포" 
                color="orange"
              />
            )}

            {/* 직무 분야 */}
            {Object.keys(analytics.workFields).length > 0 && (
              <BarChart 
                data={analytics.workFields} 
                title="💼 직무 분야" 
                color="red"
              />
            )}

            {/* 취미 분포 */}
            {Object.keys(analytics.hobbies).length > 0 && (
              <BarChart 
                data={analytics.hobbies} 
                title="🎨 취미 분포" 
                color="blue"
              />
            )}
          </div>

          {/* 참가자 목록 */}
          <div>
            <h2 className="text-2xl font-bold mb-6">참가자 상세 정보 ({participantsWithDetails.length}명)</h2>
            <div className="space-y-6">
              {participantsWithDetails.map((participant, index) => (
                <ParticipantCard 
                  key={participant.id} 
                  participant={participant} 
                  index={index} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && participantsWithDetails.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">데이터가 없습니다</h2>
          <p className="text-gray-500">이 이벤트에는 참가자가 없습니다.</p>
        </div>
      )}
    </div>
  )
}