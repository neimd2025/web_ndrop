'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessCards } from '@/hooks/use-business-cards'
import { useUserProfile } from '@/hooks/use-user-profile'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, QrCode, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function MyNamecardPage() {
  const { user, loading } = useAuth()
  const { userCard, loading: cardLoading } = useBusinessCards()
  const { profile, loading: profileLoading } = useUserProfile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 사용자 표시 이름 가져오기
  const getUserDisplayName = () => {
    if (userCard?.full_name) return userCard.full_name
    if (profile?.full_name) return profile.full_name

    if (!user) return "사용자"

    if (user.app_metadata?.provider === 'kakao') {
      return user.user_metadata?.nickname ||
             user.user_metadata?.full_name ||
             user.email?.split('@')[0] ||
             "사용자"
    }

    return user.user_metadata?.full_name ||
           user.email?.split('@')[0] ||
           "사용자"
  }

  // 사용자 이니셜 가져오기
  const getUserInitial = () => {
    const name = getUserDisplayName()
    return name.charAt(0)
  }

  // 사용자 소개 가져오기
  const getUserIntroduction = () => {
    return userCard?.introduction || profile?.introduction || "하루하루 의미있게"
  }

  // 사용자 나이 가져오기 (birth_date에서 계산)
  const getUserAge = () => {
    if (profile?.birth_date) {
      const birthDate = new Date(profile.birth_date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return `${age}세`
    }
    return "나이 정보 없음"
  }

  // 사용자 회사/직책 정보 가져오기
  const getUserCompanyInfo = () => {
    const role = userCard?.role || profile?.role || "직책"
    const company = userCard?.company || profile?.company || "회사"
    return `${role} / ${company}`
  }

  // 사용자 MBTI 가져오기
  const getUserMbti = () => {
    return userCard?.mbti || profile?.mbti || "MBTI 정보 없음"
  }

  // 사용자 키워드 가져오기
  const getUserKeywords = () => {
    return userCard?.keywords || profile?.keywords || ["사람들과 잘 어울려요", "계획을 세우는 걸 좋아해요", "새로운 아이디어를 자주 떠올려요"]
  }

  // 사용자 관심사 가져오기 (기본값)
  const getUserInterests = () => {
    return ["창업", "자기계발", "지속가능성"]
  }

  // 사용자 취미 가져오기 (기본값)
  const getUserHobbies = () => {
    return ["독서", "자기계발", "사람", "영화감상"]
  }

  // 사용자 링크 정보 가져오기 (external_link 사용)
  const getUserLinks = () => {
    const externalLink = userCard?.external_link || profile?.external_link
    if (externalLink) {
      return [{
        title: "외부 링크",
        description: "추가 정보를 확인하세요",
        url: externalLink
      }]
    }
    return []
  }

  // 공유 링크 생성
  const getShareLink = () => {
    if (userCard?.id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000")
      return `${siteUrl}/business-card/${userCard.id}`
    }
    return "naimd.link/1s2v" // 기본값
  }

  if (!mounted || loading || cardLoading || profileLoading) {
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
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">내 명함</h1>
          <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
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
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>

              {/* 이름과 소개 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getUserDisplayName()}
              </h2>
              <p className="text-gray-600 text-base mb-4">
                {getUserIntroduction()}
              </p>

              {/* 기본 정보 */}
              <div className="space-y-2 text-sm text-gray-500">
                {getUserAge() !== "나이 정보 없음" && <p>{getUserAge()}</p>}
                {(userCard?.role || profile?.role || userCard?.company || profile?.company) && (
                  <p>{getUserCompanyInfo()}</p>
                )}
                {getUserMbti() !== "MBTI 정보 없음" && <p>MBTI: {getUserMbti()}</p>}
              </div>
            </div>

            {/* 태그 섹션들 */}
            <div className="space-y-6">
              {/* 성격 */}
              {(userCard?.keywords || profile?.keywords) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">성격</h3>
                  <div className="flex flex-wrap gap-2">
                    {getUserKeywords().map((keyword: string, index: number) => (
                      <Badge key={index} className="bg-purple-600 text-white px-3 py-1">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 관심사 - 기본값이므로 제거 */}
              {/* 취미 - 기본값이므로 제거 */}

              {/* 링크들 */}
              {getUserLinks().length > 0 && getUserLinks().map((link: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">- {link.title || '링크'}</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {link.description || '링크 설명'}
                  </p>
                  <p className="text-gray-500 text-sm">{link.url || 'URL 없음'}</p>
                </div>
              ))}

              {/* 공유 링크 */}
              {userCard?.id && (
                <div className="text-center">
                  <p className="text-purple-600 text-sm font-medium">{getShareLink()}</p>
                </div>
              )}
            </div>
          </Card>

          {/* 액션 버튼들 */}
          <div className="space-y-3 flex flex-col gap-1">
            <Link href="/my-qr">
              <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                <QrCode className="w-4 h-4 mr-2" />
                QR 코드 보기
              </Button>
            </Link>

            <Link href="/namecard/edit">
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

