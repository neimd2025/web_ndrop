"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { UserBusinessCard } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Mail, Phone, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PublicBusinessCardClientProps {
  businessCard: UserBusinessCard
}

export function PublicBusinessCardClient({ businessCard }: PublicBusinessCardClientProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // 자신의 명함인지 확인
  const isOwnCard = () => {
    return user && businessCard.user_id === user.id
  }

  const handleSaveCard = async () => {
    if (!user) {
      alert('명함을 저장하려면 로그인이 필요합니다.')
      router.push('/login?type=user')
      return
    }

    // 자신의 명함인지 확인
    if (isOwnCard()) {
      alert('자신의 명함은 저장할 수 없습니다.')
      return
    }

    if (isSaved) {
      alert('이미 저장된 명함입니다!')
      return
    }

    try {
      setIsSaving(true)
      const supabase = createClient()

      // 이미 저장된 명함인지 확인
      const { data: existingCard } = await supabase
        .from('collected_cards')
        .select('id')
        .eq('collector_id', user.id)
        .eq('card_id', businessCard.id)
        .single()

      if (existingCard) {
        alert('이미 저장된 명함입니다!')
        setIsSaved(true)
        return
      }

      // 명함 저장
      const { data: savedCard, error: saveError } = await supabase
        .from('collected_cards')
        .insert({
          collector_id: user.id,
          card_id: businessCard.id,
          collected_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        console.error('명함 저장 오류:', saveError)
        alert('명함 저장에 실패했습니다.')
        return
      }

      setIsSaved(true)
      alert('명함이 성공적으로 저장되었습니다!')

      // 저장된 명함 페이지로 이동
      router.push(`/client/card-books/${savedCard.id}`)
    } catch (error) {
      console.error('명함 저장 중 오류:', error)
      alert('명함 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 사용자 표시 이름 가져오기
  const getUserDisplayName = () => {
    return businessCard?.full_name || businessCard?.name || "사용자"
  }

  // 사용자 소개 가져오기
  const getUserIntroduction = () => {
    return businessCard?.introduction || businessCard?.bio || "하루하루 의미있게"
  }

  // 나이 계산
  const getAge = () => {
    const birthDate = businessCard?.birth_date
    if (birthDate) {
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return `${age}세`
    }
    return ""
  }

  // 직책/회사 정보
  const getWorkInfo = () => {
    const workField = businessCard?.work_field || ""
    const jobTitle = businessCard?.job_title || businessCard?.title || "" // job_title 우선 사용
    const company = businessCard?.company || businessCard?.affiliation || ""

    if (workField && jobTitle) {
      return `${workField} / ${jobTitle}`
    } else if (jobTitle && company) {
      return `${jobTitle} / ${company}`
    } else if (workField) {
      return workField
    } else if (jobTitle) {
      return jobTitle
    }
    return ""
  }

  // MBTI 정보
  const getMBTI = () => {
    return businessCard?.mbti || ""
  }

  // 연락처 정보
  const getContact = () => {
    return businessCard?.contact || businessCard?.phone || businessCard?.email || ""
  }

  // 성격 키워드
  const getPersonalityKeywords = () => {
    return businessCard?.personality_keywords || businessCard?.keywords || []
  }

  // 관심사 키워드
  const getInterestKeywords = () => {
    return businessCard?.interest_keywords || []
  }

  // 취미 키워드
  const getHobbyKeywords = () => {
    return businessCard?.hobby_keywords || []
  }

  // 외부 링크 정보
  const getExternalLink = () => {
    const link = businessCard?.external_link || businessCard?.website || ""
    if (link) {
      // 링크 타입에 따라 제목과 설명 결정
      let title = "외부 링크"
      let description = "추가 정보를 확인하세요"

      if (link.includes('youtube') || link.includes('youtu.be')) {
        title = "YouTube"
        description = "Enjoy the videos and music you love, upload original content, and share it all with friends..."
      } else if (link.includes('instagram')) {
        title = "Instagram"
        description = "Follow me for more updates and behind-the-scenes content"
      } else if (link.includes('linkedin')) {
        title = "LinkedIn"
        description = "Connect with me professionally and view my career journey"
      } else if (link.includes('github')) {
        title = "GitHub"
        description = "Check out my coding projects and contributions"
      } else if (link.includes('twitter') || link.includes('x.com')) {
        title = "Twitter"
        description = "Follow me for thoughts and updates"
      } else if (link.includes('facebook')) {
        title = "Facebook"
        description = "Connect with me on social media"
      } else if (link.includes('tiktok')) {
        title = "TikTok"
        description = "Watch my creative content and videos"
      } else {
        // 일반 웹사이트인 경우
        title = "웹사이트"
        description = "Visit my website for more information"
      }

      return {
        title,
        description,
        url: link
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-semibold text-center">명함</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          {/* 명함 카드 */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-xl p-6 mb-6">
            {/* 프로필 섹션 */}
            <div className="text-center mb-6">
              {/* 프로필 이미지 */}
              <div className="w-24 h-24 bg-purple-500 rounded-full mx-auto mb-5 flex items-center justify-center">
                {businessCard?.profile_image_url ? (
                  <img
                    src={businessCard.profile_image_url}
                    alt={getUserDisplayName()}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              {/* 이름과 소개 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getUserDisplayName()}
              </h2>
              <p className="text-gray-600 text-base mb-4">
                {getUserIntroduction()}
              </p>

              {/* 기본 정보 */}
              <div className="space-y-1 text-sm text-gray-500">
                <p>{getAge() || ""}</p>
                <p>{getWorkInfo() || ""}</p>
                <p>MBTI: {getMBTI()}</p>
                <p>연락처: {getContact() || ""}</p>
              </div>
            </div>

            {/* 성격 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">성격</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {getPersonalityKeywords().length > 0 ? (
                  getPersonalityKeywords().slice(0, 3).map((keyword, index) => (
                    <Badge key={index} className="bg-[#7C3BED] text-white border-purple-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 관심사 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">관심사</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {getInterestKeywords().length > 0 ? (
                  getInterestKeywords().slice(0, 3).map((keyword, index) => (
                    <Badge key={index} className="bg-white text-gray-800 border-gray-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 취미 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">취미</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {getHobbyKeywords().length > 0 ? (
                  getHobbyKeywords().slice(0, 4).map((keyword, index) => (
                    <Badge key={index} className="bg-white text-gray-800 border-gray-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 외부 링크 섹션 */}
            <div className="mb-6">
              <h3 className="text-left text-lg font-semibold text-gray-900 mb-3">외부링크</h3>
              <div className="border border-gray-200 rounded-xl p-4">
                {getExternalLink() ? (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-2">- {getExternalLink()?.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{getExternalLink()?.description}</p>
                    <a
                      href={getExternalLink()?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
                    >
                      {getExternalLink()?.url}
                    </a>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>
          </Card>

          {/* 액션 버튼들 */}
          <div className="space-y-3 flex flex-col gap-1">
            {/* 자신의 명함이 아닐 때만 저장 버튼 표시 */}
            {!isOwnCard() && (
              <Button
                onClick={handleSaveCard}
                disabled={isSaved || isSaving}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {isSaving ? '저장 중...' : isSaved ? '저장됨' : '명함 저장하기'}
              </Button>
            )}

            {/* 자신의 명함일 때는 안내 메시지 표시 */}
            {isOwnCard() && (
              <div className="w-full h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">내 명함입니다</span>
              </div>
            )}

            {(businessCard.email || businessCard.contact) && (
              <Button
                onClick={() => window.open(`mailto:${businessCard.email || businessCard.contact}`, '_blank')}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                이메일 보내기
              </Button>
            )}

            {businessCard.phone && (
              <Button
                onClick={() => window.open(`tel:${businessCard.phone}`, '_blank')}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                전화 걸기
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Card 컴포넌트 (shadcn/ui가 없는 경우를 대비)
function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {children}
    </div>
  )
}
