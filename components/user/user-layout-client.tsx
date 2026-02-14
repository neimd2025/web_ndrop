"use client"

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { useBusinessCard } from '@/hooks/use-business-card'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface UserLayoutClientProps {
  children: React.ReactNode
  user: UserProfile
}

export function UserLayoutClient({ children, user }: UserLayoutClientProps) {
  const { loading, initialized } = useAuth('user')
  const { profile, loading: profileLoading, needsOnboarding } = useProfile()
  const { businessCard, loading: cardLoading, needsBusinessCard } = useBusinessCard()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 온보딩 및 명함 생성 리다이렉트 로직
  useEffect(() => {
    if (!mounted || !user || profileLoading || cardLoading || !initialized) {
      return
    }

    const isOnboardingRoute = pathname.startsWith('/client/onboarding')
    const isNamecardEditRoute = pathname.startsWith('/client/namecard/edit') || pathname.startsWith('/namecard/edit')

    // 프로필이 필요한 경우
    if (needsOnboarding && !isOnboardingRoute && !isNamecardEditRoute) {
      router.push('/client/onboarding')
      return
    }

    // 프로필은 있지만 명함이 필요한 경우
    if (!needsOnboarding && needsBusinessCard && !isNamecardEditRoute && !isOnboardingRoute) {
      router.push('/client/my-namecard')
      return
    }
  }, [mounted, initialized, user?.id, profileLoading, cardLoading, needsOnboarding, needsBusinessCard, pathname])

  // 브라우저 알림: 권한 요청 및 실시간 메시지 알림
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mounted || !initialized) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    const supabase = createClient()
    const channel = supabase
      .channel('browser-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_meeting_messages' }, (payload: any) => {
        const row = payload?.new
        if (!row) return
        if (row.sender_id === user?.id) return
        if (document.visibilityState === 'visible') return
        if ('Notification' in window && Notification.permission === 'granted') {
          const body = (row.content || '').slice(0, 60)
          try {
            new Notification('새 메시지', { body })
          } catch {}
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [mounted, initialized, user?.id])

  // 로딩 중
  if (!mounted || loading || !initialized || (user && (profileLoading || cardLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
