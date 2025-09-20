"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserProfile, UserBusinessCard } from '@/lib/supabase/user-server-actions'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, QrCode, User } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
    return userCard?.name || user?.full_name || user?.email?.split('@')[0] || "사용자"
  }

  // 사용자 소개 가져오기
  const getUserIntroduction = () => {
    return userCard?.bio || "하루하루 의미있게"
  }

  // 사용자 회사/직책 정보 가져오기
  const getUserCompanyInfo = () => {
    const role = userCard?.title || user?.role || "직책"
    const company = userCard?.company || user?.company || "회사"
    return `${role} / ${company}`
  }

  // 사용자 링크 정보 가져오기
  const getUserLinks = () => {
    if (userCard?.website) {
      return [{
        title: "웹사이트",
        description: "추가 정보를 확인하세요",
        url: userCard.website
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
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/user/home">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">내 명함</h1>
          <div className="w-10"></div>
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
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={getUserDisplayName()}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-600" />
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
              <div className="space-y-2 text-sm text-gray-500">
                {(userCard?.title || user?.role || userCard?.company || user?.company) && (
                  <p>{getUserCompanyInfo()}</p>
                )}
                {userCard?.email && <p>{userCard.email}</p>}
                {userCard?.phone && <p>{userCard.phone}</p>}
              </div>
            </div>

            {/* 링크들 */}
            {getUserLinks().length > 0 && (
              <div className="space-y-4">
                {getUserLinks().map((link: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">- {link.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                    <p className="text-gray-500 text-sm">{link.url}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 공유 링크 */}
            {userCard?.id && (
              <div className="text-center mt-6">
                <p className="text-purple-600 text-sm font-medium">{getShareLink()}</p>
              </div>
            )}
          </Card>

          {/* 액션 버튼들 */}
          <div className="space-y-3 flex flex-col gap-1">
            <Link href="/user/my-qr">
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