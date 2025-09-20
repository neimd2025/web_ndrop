"use client"

import { createClient } from '@/utils/supabase/client'
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

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // 실패해도 로그인 페이지로 이동
      router.push('/admin/login')
    }
  }

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

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login')
          }, 100)
          return
        }

        // 관리자 권한 확인
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, email, role_id')
          .eq('id', session.user.id)
          .eq('role_id', 2)
          .single()

        if (!mounted) return

        if (!profile) {
          await supabase.auth.signOut()
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login?error=unauthorized')
          }, 100)
          return
        }

        if (mounted) {
          setAdmin(profile)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1">
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                관리자 패널
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {admin.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}