'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface AuthErrorHandlerProps {
  children: React.ReactNode
}

export default function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const { handleTokenExpired } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // 전역 에러 핸들러 등록
    const handleAuthError = (event: CustomEvent) => {
      const error = event.detail

      if (error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('Refresh Token Not Found')) {

        console.warn('🔄 리프레시 토큰 에러 감지:', error.message)

        // 사용자에게 친화적인 메시지 표시 (자동 리다이렉트 제거)
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
          duration: 8000,
          action: {
            label: '로그인',
            onClick: () => {
              handleTokenExpired()
            }
          }
        })

        // 자동 리다이렉트 제거 - 사용자가 직접 클릭하도록 변경
      }
    }

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('auth-error', handleAuthError as EventListener)

    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener)
    }
  }, [handleTokenExpired])

  return <>{children}</>
}

// 에러를 전역으로 발생시키는 유틸리티 함수
export const triggerAuthError = (error: any) => {
  const event = new CustomEvent('auth-error', { detail: error })
  window.dispatchEvent(event)
}
