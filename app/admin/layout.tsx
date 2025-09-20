"use client"

import { Button } from '@/components/ui/button'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import Link from 'next/link'
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { admin, loading: authLoading, initialized: adminInitialized, initializeAuth } = useAdminAuthStore()
  const [mounted, setMounted] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Admin auth 초기화 (로그인/회원가입 페이지에서도 필요)
  useEffect(() => {
    if (mounted && !initRef.current) {
      initRef.current = true
      initializeAuth()
    }
  }, [mounted, initializeAuth])

  // admin 인증 페이지들은 인증 체크 제외하지만 로딩은 표시
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    // Auth 초기화 중이면 로딩 표시
    if (!mounted || (authLoading && !adminInitialized)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">초기화 중...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // 로딩 중
  if (!mounted || authLoading || !adminInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우
  if (!admin) {
    const loginUrl = `/admin/login?returnTo=${encodeURIComponent(pathname)}`

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">관리자 로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">관리자 페이지에 접근하려면 로그인해주세요.</p>
          <Link href="/login?type=admin&returnTo=/admin/dashboard">
            <Button>관리자 로그인</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 관리자 인증 완료 - admin이 있으면 이미 관리자 권한이 확인된 상태

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
