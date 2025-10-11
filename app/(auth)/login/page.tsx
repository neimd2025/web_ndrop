'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SocialLoginButton, type SocialProvider } from '@/components/ui/social-login-button'
import { useAuth } from '@/hooks/use-auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Zod 스키마 정의
const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const searchParams = useSearchParams()
  const isAdminLogin = searchParams.get('type') === 'admin'
  const router = useRouter()

  // 관리자 로그인 시도 시 관리자 로그인 페이지로 리다이렉트
  if (isAdminLogin) {
    router.push('/admin/login')
    return null
  }

  const { signInWithEmail, signInWithOAuth, user, loading: authLoading } = useAuth('user')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (user && !authLoading) {
      const returnTo = searchParams.get('returnTo')

      // 리다이렉트 전에 잠시 대기하여 상태가 안정화되도록 함
      const timer = setTimeout(() => {
        if (isAdminLogin) {
          const redirectUrl = returnTo || '/admin'
          window.location.href = redirectUrl
        } else {
          const redirectUrl = returnTo || '/client/home'
          window.location.href = redirectUrl
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, authLoading, searchParams, isAdminLogin])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      console.log('🔐 로그인 시도:', data.email)
      const { data: result, error } = await signInWithEmail(data.email, data.password)

      if (error) {
        console.error('❌ 로그인 실패:', error)
        // 구체적인 에러 메시지 표시
        const errorMessage = error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
        toast.error(errorMessage)

        // 가입되지 않은 사용자인 경우 회원가입 페이지로 안내
        if (error.message?.includes('가입되지 않은') || error.message?.includes('not found')) {
          setTimeout(() => {
            router.push('/signup')
          }, 2000)
        }
      } else if (result?.user) {
        console.log('✅ 로그인 성공:', result.user.email)
        toast.success('로그인되었습니다!')
        const returnTo = searchParams.get('returnTo')

        // 리다이렉트 전에 잠시 대기하여 상태가 안정화되도록 함
        setTimeout(() => {
          if (isAdminLogin) {
            window.location.href = returnTo || '/admin'
          } else {
            window.location.href = returnTo || '/client/home'
          }
        }, 100)
      } else {
        console.log('⚠️ 로그인 데이터 없음:', result)
        toast.error('로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 로그인 중 오류:', error)
      toast.error('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: SocialProvider) => {
    setLoading(true)
    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        const providerName = provider === 'google' ? 'Google' :
                          provider === 'kakao' ? 'Kakao' : 'Naver'
        toast.error(`${providerName} 로그인에 실패했습니다: ${error.message}`)
      }
    } catch (error) {
      toast.error('소셜 로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* 뒤로가기 버튼 */}
      {/* <button
        onClick={() => router.back()}
        className="absolute top-12 left-6 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-gray-700" />
      </button> */}

      {/* 메인 컨테이너 */}
      <div className="flex flex-col">
        {/* 상단 로고 및 환영 메시지 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-8">
          <div className="text-center space-y-6">
            {/* 로고 */}
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xl">N</span>
            </div>

            {/* 환영 메시지 */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdminLogin ? '관리자 로그인' : '로그인'}
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                {isAdminLogin ? '관리자 계정으로 로그인해주세요' : '모두의 특별함이, 나답게 연결되는 시작'}
              </p>
            </div>
          </div>
        </div>

        {/* 로그인 섹션 */}
        <div className="px-5 pb-8">
          {/* 이메일/비밀번호 입력 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">이메일</Label>
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">비밀번호</Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* 이메일 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl mb-7"
              disabled={loading || isSubmitting}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center mb-7">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            <SocialLoginButton
              provider="google"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
            />

            {/* <SocialLoginButton
              provider="kakao"
              onClick={() => handleOAuthLogin('kakao')}
              disabled={loading}
            /> */}

            {/* <SocialLoginButton
              provider="naver"
              onClick={() => handleOAuthLogin('naver')}
              disabled={loading}
            /> */}
          </div>
        </div>

        {/* 하단 링크들 */}
        <div className="px-5 pb-8">
          <div className="space-y-6 text-center">
            {/* 비밀번호 찾기 */}
            <div className="border-b border-gray-200 pb-6">
              <Link
                href="/forgot-password"
                className="text-purple-600 font-medium text-sm hover:text-purple-700"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 회원가입 */}
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">
                아직 계정이 없으신가요?
              </p>
              <Link
                href={`/signup${isAdminLogin ? '?type=admin' : '?type=user'}`}
                className="text-purple-600 font-medium text-sm hover:text-purple-700"
              >
                {isAdminLogin ? '관리자 계정 만들기' : '회원가입하기'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
