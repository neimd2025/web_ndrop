"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserBusinessCard, UserProfile } from '@/lib/supabase/user-server-actions'
import { motion } from 'framer-motion'
import { Edit, QrCode, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import MobileHeader from '../mobile-header'

interface UserMyNamecardClientProps {
  user: UserProfile
  businessCards: UserBusinessCard[]
}

export function UserMyNamecardClient({ user, businessCards }: UserMyNamecardClientProps) {
  const [mounted, setMounted] = useState(false)
  const userCard = businessCards.find(card => card.is_public) || businessCards[0]

  useEffect(() => {
    setMounted(true)
  }, [])

  // 사용자 표시 이름 가져오기
  const getUserDisplayName = () => {
    return userCard?.full_name || userCard?.name || user?.full_name || user?.email?.split('@')[0] || "사용자"
  }

  // 사용자 소개 가져오기
  const getUserIntroduction = () => {
    return userCard?.introduction || userCard?.bio || user?.introduction || "하루하루 의미있게"
  }

  // 나이 계산
  const getAge = () => {
    const birthDate = userCard?.birth_date || user?.birth_date
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
    const workField = userCard?.work_field || user?.work_field || ""
    const role = userCard?.title || user?.role || ""
    const company = userCard?.company || user?.company || ""

    if (workField && role) {
      return `${workField} / ${role}`
    } else if (role && company) {
      return `${role} / ${company}`
    } else if (workField) {
      return workField
    } else if (role) {
      return role
    }
    return ""
  }

  // MBTI 정보
  const getMBTI = () => {
    return userCard?.mbti || user?.mbti || ""
  }

  // 연락처 정보
  const getContact = () => {
    return userCard?.contact || userCard?.phone || user?.contact || ""
  }

  // 성격 키워드
  const getPersonalityKeywords = () => {
    return userCard?.personality_keywords || user?.personality_keywords || []
  }

  // 관심사 키워드
  const getInterestKeywords = () => {
    return userCard?.interest_keywords || user?.interest_keywords || userCard?.keywords || user?.keywords || []
  }

  // 취미 키워드
  const getHobbyKeywords = () => {
    return userCard?.hobby_keywords || user?.hobby_keywords || []
  }

  // 외부 링크 정보
  const getExternalLink = () => {
    const link = userCard?.external_link || user?.external_link || userCard?.website || ""
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

  // 공유 링크 생성
  const getShareLink = () => {
    if (userCard?.id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000")
      return `${siteUrl}/business-card/${userCard.id}`
    }
    return "naimd.link/1s2v"
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">명함 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <MobileHeader title="내 명함" />

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
                {userCard?.profile_image_url || user?.profile_image_url ? (
                  <img
                    src={userCard?.profile_image_url || user?.profile_image_url}
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
                    <p className="text-gray-500 text-sm">{getExternalLink()?.url}</p>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 공유 링크 */}
            <div className="text-center">
              <p className="text-purple-600 text-sm font-medium">{getShareLink()}</p>
            </div>
          </Card>

          {/* 액션 버튼들 */}
          <div className="space-y-3 flex flex-col gap-1">
            <Link href="/client/my-qr">
              <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                <QrCode className="w-4 h-4 mr-2" />
                QR 코드 보기
              </Button>
            </Link>

            <Link href="/client/namecard/edit">
              <Button variant="outline" className="w-full h-12 border-gray-200 hover:bg-white">
                <Edit className="w-4 h-4 mr-2" />
                명함 수정하기
              </Button>
            </Link>
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
