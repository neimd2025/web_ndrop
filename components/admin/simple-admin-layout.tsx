"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from 'react'

interface AdminUser {
  id: string
  email: string
  role_id: number
}

export function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)


  // 인증 페이지 체크 (hooks 호출 후)
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup'

  useEffect(() => {
    // 인증 페이지에서는 인증 체크 스킵
    if (isAuthPage) {
      setLoading(false)
      return
    }

    let mounted = true
    let timeoutId: NodeJS.Timeout

    const checkAuth = () => {
      try {
        // 쿠키에서 먼저 확인
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const adminToken = getCookie('admin_token')
        const adminUser = getCookie('admin_user')

        if (!mounted) return

        if (!adminToken || !adminUser) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login')
          }, 100)
          return
        }

        const userData = JSON.parse(decodeURIComponent(adminUser))
        if (userData.role_id !== 2) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login?error=unauthorized')
          }, 100)
          return
        }

        if (mounted) {
          console.log('=== 관리자 로그인 상태 (Cookie) ===')
          console.log('관리자 계정:', userData)
          console.log('관리자 ID:', userData.id)
          console.log('관리자 사용자명:', userData.username)
          console.log('역할 ID:', userData.role_id)
          setAdmin(userData)
        }
      } catch (error) {
        console.error('Cookie Auth check failed:', error)
        if (mounted) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login?error=auth_failed')
          }, 100)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [pathname, isAuthPage])

  // 인증 페이지는 바로 렌더링
  if (isAuthPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null // 리다이렉트 중
  }

  // 관리자 인증 완료 - 레이아웃 렌더링
  return (
    <div className="min-h-screen ">
      <div className="flex">
        <div className="flex-1">
            {children}
        </div>
      </div>
    </div>
  )
}
