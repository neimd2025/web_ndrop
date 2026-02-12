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
    return primaryCard?.introduction || primaryCard?.bio || (user as any)?.introduction || "하루하루 의미있게"
  }

  // 사용자 회사/직책 정보 가져오기
  const getUserCompanyInfo = () => {
    const primaryCard = businessCards.find(card => card.is_public) || businessCards[0]
    const jobTitle = primaryCard?.job_title || primaryCard?.title || (user && 'job_title' in user ? user.job_title : undefined)
    const company = primaryCard?.company || primaryCard?.affiliation || (user && 'company' in user ? user.company : undefined)
    if (jobTitle && company) return `${jobTitle} / ${company}`
    if (jobTitle) return jobTitle
    if (company) return company
    return null
  }

  // 사용자 연락처 정보 가져오기
  const getUserContact = () => {
    const primaryCard = businessCards.find(card => card.is_public) || businessCards[0]
    return primaryCard?.phone || primaryCard?.contact || (user as any)?.contact
  }

  // 사용자 MBTI 정보 가져오기
  const getUserMBTI = () => {
    const primaryCard = businessCards.find(card => card.is_public) || businessCards[0]
    return primaryCard?.mbti || (user as any)?.mbti
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative text-white overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-0 left-[10%] w-[1px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[120px] bg-gradient-to-b from-transparent via-blue-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "8s" }}></div>
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 px-5 py-4 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-white">마이페이지</h1>
        </div>

        <div className="p-5 space-y-6">
          {/* 내 명함 카드 */}
          <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10 shadow-2xl shadow-purple-900/20 rounded-xl p-6 relative overflow-hidden">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
              {/* 프로필 섹션 */}
              <div className="text-center mb-6">
                {/* 프로필 이미지 */}
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg shadow-purple-500/30 p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    {(user as any)?.profile_image_url ? (
                      <img
                        src={(user as any).profile_image_url}
                        alt={getUserDisplayName()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* 이름과 소개 */}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {getUserDisplayName()}
                </h2>
                <p className="text-slate-300 text-base mb-4">
                  {getUserIntroduction()}
                </p>

                {/* 기본 정보 */}
                <div className="space-y-1 text-sm text-slate-400">
                  {getUserMBTI() && <p className="flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>MBTI: {getUserMBTI()}</p>}
                  {getUserCompanyInfo() && <p className="flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{getUserCompanyInfo()}</p>}
                  {getUserContact() && <p className="flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>연락처: {getUserContact()}</p>}
                </div>
              </div>

              {/* 통계 섹션 */}
              <div className="grid grid-cols-3 gap-4 mb-6 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
                  <div className="text-xs text-slate-400 mt-1">참가 이벤트</div>
                </div>
                <div className="text-center border-l border-white/10">
                  <div className="text-2xl font-bold text-white">{stats.totalBusinessCards}</div>
                  <div className="text-xs text-slate-400 mt-1">내 명함</div>
                </div>
                <div className="text-center border-l border-white/10">
                  <div className="text-2xl font-bold text-white">{stats.profileViews}</div>
                  <div className="text-xs text-slate-400 mt-1">프로필 조회</div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="border-t border-white/10 pt-4 space-y-2 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>이메일</span>
                  <span className="text-slate-400">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>가입일</span>
                  <span className="text-slate-400">{user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 메뉴 */}
          <div className="space-y-3">
            <Link href="/client/namecard/edit">
              <div className="cursor-pointer hover:bg-white/10 transition-all duration-300 p-4 rounded-xl flex items-center border border-white/10 bg-slate-900/50 backdrop-blur-sm group">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4 group-hover:bg-purple-500/30 transition-colors">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">내 명함 수정</span>
              </div>
            </Link>

            {/* 약관 보기 버튼 */}
            <Link href="/client/terms">
              <div className="cursor-pointer hover:bg-white/10 transition-all duration-300 p-4 rounded-xl flex items-center border border-white/10 bg-slate-900/50 backdrop-blur-sm group">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 group-hover:bg-blue-500/30 transition-colors">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">약관 보기</span>
              </div>
            </Link>

            <div
              onClick={handleLogout}
              className="cursor-pointer hover:bg-white/10 transition-all duration-300 p-4 rounded-xl flex items-center border border-white/10 bg-slate-900/50 backdrop-blur-sm group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mr-4 group-hover:bg-slate-600/50 transition-colors">
                <LogOut className="w-5 h-5 text-slate-400" />
              </div>
              <span className="font-medium text-slate-200 group-hover:text-white transition-colors">로그아웃</span>
            </div>

            {/* 계정 탈퇴 버튼 */}
            <div
              onClick={handleDeleteAccount}
              className="cursor-pointer hover:bg-red-900/20 transition-all duration-300 p-4 rounded-xl flex items-center border border-red-500/20 bg-red-950/10 backdrop-blur-sm group mt-6"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4 group-hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <span className="font-medium text-red-400 group-hover:text-red-300 transition-colors">계정 탈퇴</span>
            </div>
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
