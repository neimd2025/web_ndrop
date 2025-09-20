"use client"

import { createClient } from '@/utils/supabase/client'
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role_id: number
}


export function SimpleUserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login?type=user')
    } catch (error) {
      console.error('Logout failed:', error)
      // 실패해도 로그인 페이지로 이동
      router.push('/login?type=user')
    }
  }

  // 인증 페이지 체크 (hooks 호출 후)
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname.startsWith('/(auth)')

  useEffect(() => {
    // 인증 페이지에서는 인증 체크 스킵
    if (isAuthPage) {
      setLoading(false)
      return
    }

    // Middleware에서 이미 인증 처리하므로 여기서는 단순히 사용자 정보만 가져옴
    const getUserInfo = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // 사용자 프로필 확인
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, role_id')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            console.log('=== 클라이언트 로그인 상태 ===')
            console.log('클라이언트 계정:', profile)
            setUser(profile)
          }
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserInfo()
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

  if (!user) {
    return null // 리다이렉트 중
  }

  // 온보딩 페이지인 경우 - 전체화면 표시 (헤더 숨김)
  if (pathname === '/client/onboarding') {
    return <>{children}</>
  }

  // 일반 레이아웃 표시
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1">
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Neimed
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {user.full_name || user.email}
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
            {children}
        </div>
      </div>
    </div>
  )
}
