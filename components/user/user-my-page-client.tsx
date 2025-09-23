"use client"

import DeleteAccountModal from '@/components/delete-account-modal'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { UserBusinessCard, UserEventParticipation, UserProfile } from '@/lib/supabase/user-server-actions'
import { FileText, LogOut, Settings, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserMyPageClientProps {
  user?: UserProfile
  businessCards?: UserBusinessCard[]
  participatedEvents?: UserEventParticipation[]
  stats?: {
    totalEvents: number
    totalBusinessCards: number
    profileViews: number
  }
}

export function UserMyPageClient({
  user: initialUser,
  businessCards: initialBusinessCards,
  participatedEvents: initialParticipatedEvents,
  stats: initialStats
}: UserMyPageClientProps = {}) {
  const { user: authUser, signOut } = useAuth('user')
  const user = initialUser || authUser
  const businessCards = initialBusinessCards || []
  const participatedEvents = initialParticipatedEvents || []
  const stats = initialStats || { totalEvents: 0, totalBusinessCards: 0, profileViews: 0 }
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  // 사용자 표시 이름 가져오기
  const getUserDisplayName = () => {
    return (user as any)?.full_name || user?.email?.split('@')[0] || "사용자"
  }

  // 사용자 소개 가져오기
  const getUserIntroduction = () => {
    const primaryCard = businessCards.find(card => card.is_public) || businessCards[0]
    return primaryCard?.bio || "하루하루 의미있게"
  }

  // 사용자 회사/직책 정보 가져오기
  const getUserCompanyInfo = () => {
    const primaryCard = businessCards.find(card => card.is_public) || businessCards[0]
    const role = primaryCard?.title || user?.role
    const company = primaryCard?.company || (user as any)?.company
    if (role && company) return `${role} / ${company}`
    if (role) return role
    if (company) return company
    return null
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
              {(user as any)?.profile_image_url ? (
                <img
                  src={(user as any).profile_image_url}
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
              {getUserCompanyInfo() && <p>{getUserCompanyInfo()}</p>}
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">참가 이벤트</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalBusinessCards}</div>
              <div className="text-sm text-gray-600">내 명함</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.profileViews}</div>
              <div className="text-sm text-gray-600">프로필 조회</div>
            </div>
          </div>

          {/* 계정 정보 */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>이메일</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span>가입일</span>
              <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}</span>
            </div>
          </div>
        </Card>

        {/* 메뉴 */}
        <div className="space-y-4 flex flex-col gap-1">
          <Link href="/client/namecard/edit">
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
          <Link href="/client/terms">
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
