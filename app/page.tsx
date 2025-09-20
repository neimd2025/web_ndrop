"use client"

import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useUserAuthStore } from '@/stores/user-auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RootPage() {
  const { user: userAccount, loading: userLoading, initialized: userInitialized } = useUserAuthStore()
  const { admin: adminAccount, loading: adminLoading, initialized: adminInitialized } = useAdminAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (userInitialized && adminInitialized) {
      if (adminAccount) {
        // 관리자 계정이 있으면 관리자 대시보드로
        router.push('/admin/dashboard')
      } else if (userAccount) {
        // 일반 사용자 계정이 있으면 사용자 홈으로
        router.push('/user/home')
      } else {
        // 둘 다 없으면 로그인 페이지로
        router.push('/login?type=user')
      }
    }
  }, [userAccount, adminAccount, userInitialized, adminInitialized, router])

  if (userLoading || adminLoading || !userInitialized || !adminInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Neimed
            </h1>
            <p className="text-gray-600">
              로딩 중...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
