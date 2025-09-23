"use client"

import { useAdminAuth } from '@/hooks/use-admin-auth'
import { usePathname, useRouter } from "next/navigation"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, loading: authLoading } = useAdminAuth()

  // admin 인증 페이지들은 인증 체크 완전 제외
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>
  }

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">관리자 로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">관리자 페이지에 접근하려면 로그인해주세요.</p>
          <a href="/login?type=admin&returnTo=/admin/dashboard" className="inline-block">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
              관리자 로그인
            </button>
          </a>
        </div>
      </div>
    )
  }

  // 인증 완료 - children 렌더링
  return <>{children}</>
}
