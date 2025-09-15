'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 OAuth 콜백 처리 시작')
      
      try {
        const supabase = createClient()
        
        // 세션 확인
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ OAuth 콜백 실패:', error)
          setError(error.message)
          toast.error('로그인 처리 중 오류가 발생했습니다.')
          
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        if (data.session && data.session.user) {
          console.log('✅ OAuth 로그인 성공:', data.session.user.email)

          // 사용자 프로필 존재 여부 확인 및 생성
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (!profile) {
            console.log('📄 사용자 프로필 생성 중...')

            // 사용자 메타데이터에서 이름 추출
            const fullName = data.session.user.user_metadata?.name ||
                           data.session.user.user_metadata?.full_name ||
                           data.session.user.email?.split('@')[0] ||
                           '사용자'

            // 관리자 여부 확인
            const isAdmin = data.session.user.user_metadata?.isAdmin === true

            try {
              const profileResponse = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: data.session.user.id,
                  email: data.session.user.email,
                  name: fullName,
                  isAdmin
                })
              })

              if (!profileResponse.ok) {
                console.error('❌ 프로필 생성 실패')
                toast.error('프로필 생성에 실패했습니다.')
              } else {
                console.log('✅ 프로필 생성 성공')
                toast.success('프로필이 생성되었습니다!')
              }
            } catch (error) {
              console.error('❌ 프로필 생성 오류:', error)
              toast.error('프로필 생성 중 오류가 발생했습니다.')
            }
          }

          // returnTo 파라미터 확인
          const urlParams = new URLSearchParams(window.location.search)
          const returnTo = urlParams.get('returnTo') || '/home'

          toast.success('로그인되었습니다!')

          // 페이지 새로고침으로 확실한 상태 동기화
          window.location.href = returnTo
        } else {
          console.log('⚠️ 세션 정보가 없습니다.')
          setError('세션 정보를 찾을 수 없습니다.')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }
      } catch (error) {
        console.error('❌ OAuth 콜백 처리 중 예외:', error)
        setError('로그인 처리 중 오류가 발생했습니다.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              로그인 처리 중...
            </h1>
            <p className="text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 px-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">!</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              로그인 실패
            </h1>
            <p className="text-gray-600 text-sm">
              {error}
            </p>
            <p className="text-gray-500 text-sm">
              자동으로 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}