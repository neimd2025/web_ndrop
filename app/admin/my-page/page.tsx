"use client"

import DeleteAccountModal from '@/components/delete-account-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Settings, Shield, Trash2, User, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../../hooks/use-admin-auth'

export default function AdminMyPage() {
  const { admin, loading: authLoading, signOut } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, authLoading, router])

  const handleLogout = async () => {
    await signOut()
  }

  const handleSwitchToUser = () => {
    router.push("/client/home")
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  // 현재 관리자 페이지에 있는지 확인
  const isInAdminPage = pathname?.startsWith('/admin')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">인증 상태 확인 중...</h2>
          <p className="text-gray-600">잠시만 기다려 주세요.</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">마이페이지를 보려면 로그인해주세요.</p>
          <Link href="/admin/login">
            <Button>관리자 로그인하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-xl font-bold text-gray-900">관리자 마이페이지</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* 사용자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              사용자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">사용자명</span>
              <span className="font-medium">{admin.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">이름</span>
              <span className="font-medium">{admin.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">역할</span>
              <span className="font-medium">{admin.role}</span>
            </div>
            {/* 관리자 배지 */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                관리자
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 메뉴 */}
        <div className="space-y-4">
          <Link href="/profile/edit">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">프로필 수정</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 일반 사용자 페이지로 전환 버튼 */}
          <div
            onClick={handleSwitchToUser}
            className="w-full justify-start cursor-pointer hover:bg-blue-50 p-4 rounded-lg
            flex items-center border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
          >
            <UserCheck className="w-5 h-5 mr-3 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium text-blue-700">일반 사용자 페이지로</span>
              <span className="text-xs text-blue-500">홈 화면으로 이동하여 일반 사용자 모드로 전환</span>
            </div>
          </div>

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

      {/* 탈퇴 확인 모달 */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
