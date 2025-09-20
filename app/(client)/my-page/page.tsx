"use client"

import DeleteAccountModal from '@/components/delete-account-modal'
import { useLoading } from '@/components/loading-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessCards } from '@/hooks/use-business-cards'
import { useUserProfile } from '@/hooks/use-user-profile'
import { FileText, LogOut, Settings, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MyPage() {
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()
  const { userCard } = useBusinessCards()
  const { isLoading } = useLoading()
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

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
    return null
  }

  // 사용자 회사/직책 정보 가져오기
  const getUserCompanyInfo = () => {
    const role = userCard?.role || profile?.role
    const company = userCard?.company || profile?.affiliation
    if (role && company) return `${role} / ${company}`
    if (role) return role
    if (company) return company
    return null
  }

  // 사용자 MBTI 가져오기
  const getUserMbti = () => {
    return userCard?.mbti || profile?.mbti
  }

  // 사용자 키워드 가져오기
  const getUserKeywords = () => {
    return userCard?.keywords || profile?.personality_keywords || []
  }

  // 사용자 링크 가져오기
  const getUserLinks = () => {
    const links = []
    if (profile?.external_link) {
      links.push({
        title: '대표 링크',
        description: '개인 또는 회사 대표 링크',
        url: profile.external_link
      })
    }
    return links
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">마이페이지를 보려면 로그인해주세요.</p>
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* 내 명함 카드 */}
        <Card className="bg-white border border-gray-200 shadow-lg rounded-xl p-6">
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
              {getUserAge() && <p>{getUserAge()}</p>}
              {getUserCompanyInfo() && <p>{getUserCompanyInfo()}</p>}
              {getUserMbti() && <p>MBTI: {getUserMbti()}</p>}
            </div>
          </div>

          {/* 태그 섹션들 */}
          <div className="space-y-6">
            {/* 성격 키워드 */}
            {getUserKeywords() && getUserKeywords()!.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">성격</h3>
                <div className="flex flex-wrap gap-2">
                  {getUserKeywords()!.map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-purple-600 text-white px-3 py-1">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 링크들 */}
            {getUserLinks().length > 0 && getUserLinks().map((link: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">- {link.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                <p className="text-gray-500 text-sm">{link.url}</p>
              </div>
            ))}

            {/* 계정 정보 */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>이메일</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>가입일</span>
                <span>{new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 메뉴 */}
        <div className="space-y-4 flex flex-col gap-1">
          <Link href="/namecard/edit">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">내 명함 수정</span>
                </div>
              </CardContent>
            </Card>
          </Link>



          {/* 약관 보기 버튼 */}
          <Link href="/terms">
            <div className="w-full justify-start cursor-pointer hover:bg-gray-50 p-4 rounded-lg
            flex items-center border border-gray-200">
              <FileText className="w-5 h-5 mr-3 text-gray-500" />
              <span className="font-medium">약관 보기</span>
            </div>
          </Link>

          <div
            onClick={handleLogout}
            className="w-full justify-start cursor-pointer hover:bg-gray-100 p-4 rounded-lg
            flex items-center border border-gray-200"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-500" />
            <span className="font-medium">로그아웃</span>
          </div>

          {/* 계정 탈퇴 버튼 */}
          <div
            onClick={handleDeleteAccount}
            className="w-full justify-start cursor-pointer hover:bg-red-50 p-4 rounded-lg
            flex items-center border border-red-200 bg-red-50"
          >
            <Trash2 className="w-5 h-5 mr-3 text-red-500" />
            <span className="font-medium text-red-600">계정 탈퇴</span>
          </div>
        </div>
      </div>

      {/* 계정 탈퇴 모달 */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
