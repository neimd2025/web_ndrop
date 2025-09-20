"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserAuthStore } from '@/stores/user-auth-store'
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

const resetPasswordSchema = z.object({
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const { setPasswordResetInProgress, clearPasswordResetState } = useUserAuthStore()

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

        useEffect(() => {
    const checkToken = async () => {
      try {
        // localStorage에서 비밀번호 재설정 상태 확인
        const resetInProgress = localStorage.getItem('passwordResetInProgress')
        const resetEmail = localStorage.getItem('passwordResetEmail')

        if (resetInProgress === 'true' && resetEmail) {
          console.log('비밀번호 재설정 진행 중 상태 감지:', resetEmail)
          setPasswordResetInProgress(true, resetEmail)
          setCurrentUser(resetEmail)
        }

        // URL에서 파라미터 확인
        const code = searchParams.get('code')
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        // URL 해시에서 에러 파라미터 확인
        const hash = window.location.hash
        const urlParams = new URLSearchParams(hash.substring(1))
        const error = urlParams.get('error')
        const errorCode = urlParams.get('error_code')
        const errorDescription = urlParams.get('error_description')

        console.log('URL 파라미터 확인:', {
          code: !!code,
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error,
          errorCode,
          errorDescription
        })

        // 에러가 있으면 토큰이 유효하지 않음
        if (error || errorCode === 'otp_expired') {
          console.log('에러 감지됨:', error, errorCode)
          setIsValidToken(false)
          setIsCheckingToken(false)
          return
        }

        // recovery 링크가 있으면 (code 또는 토큰) 유효한 것으로 간주
        if (code || (type === 'recovery' && accessToken && refreshToken)) {
          console.log('Recovery 링크 감지됨')

          // 잠시 대기 후 세션 확인 (Supabase가 자동으로 처리할 시간을 줌)
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
              console.log('세션 확인됨 - recovery 성공', session.user.email)
              setIsValidToken(true)
              setCurrentUser(session.user.email || null)
                            setPasswordResetInProgress(true, session.user.email || undefined)

              // localStorage에 비밀번호 재설정 상태 저장
              localStorage.setItem('passwordResetInProgress', 'true')
              localStorage.setItem('passwordResetEmail', session.user.email || '')

              // 사용자에게 현재 상태 알림
              toast.success(`${session.user.email} 계정의 비밀번호를 변경할 수 있습니다`)
            } else {
              console.log('세션이 없음 - recovery 실패')
              setIsValidToken(false)
            }
            setIsCheckingToken(false)
          }, 1000)

          return
        }

        // recovery 링크가 없으면 유효하지 않음
        console.log('Recovery 링크가 없음')
        setIsValidToken(false)
        setIsCheckingToken(false)
      } catch (error) {
        console.error('토큰 확인 오류:', error)
        setIsValidToken(false)
        setIsCheckingToken(false)
      }
    }

    checkToken()
  }, [searchParams, supabase.auth])

    const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true)

    try {
      // 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('세션이 유효하지 않습니다. 다시 시도해주세요.')
        return
      }

      // 기존 비밀번호와 동일한지 확인 (선택사항)
      // 실제로는 Supabase가 자동으로 처리하지만, 사용자에게 미리 알려줄 수 있음
      const { error: checkError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (checkError) {
        console.error('비밀번호 업데이트 오류:', checkError)

        // 특정 오류 메시지 처리
        if (checkError.message?.includes('different from the old password')) {
          toast.error('새 비밀번호는 기존 비밀번호와 달라야 합니다.')
        } else if (checkError.message?.includes('weak')) {
          toast.error('더 강력한 비밀번호를 사용해주세요.')
        } else {
          toast.error('비밀번호 변경에 실패했습니다: ' + checkError.message)
        }
        return
      }

      // 비밀번호 변경 후 로그아웃 (보안상)
      await supabase.auth.signOut()

            setIsSuccess(true)
      clearPasswordResetState()

      // localStorage에서 비밀번호 재설정 상태 제거
      localStorage.removeItem('passwordResetInProgress')
      localStorage.removeItem('passwordResetEmail')

      toast.success('비밀번호가 성공적으로 변경되었습니다!')

      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      toast.error('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 토큰 확인 중
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              토큰 확인 중
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              비밀번호 재설정 링크를 확인하고 있습니다
            </p>
          </div>
        </div>
      </div>
    )
  }

    // 유효하지 않은 토큰
  if (!isValidToken) {
    // URL 해시에서 에러 정보 확인
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.substring(1))
    const error = hashParams.get('error')
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    // URL 파라미터도 확인
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const accessToken = searchParams.get('access_token')

    console.log('토큰 검증 실패 - 디버깅 정보:', {
      urlParams: { code, type, hasAccessToken: !!accessToken },
      hashParams: { error, errorCode, errorDescription },
      currentUrl: window.location.href,
      currentHash: window.location.hash
    })

    // 에러 메시지 결정
    let errorTitle = '유효하지 않은 링크'
    let errorMessage = '비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다'

    if (errorCode === 'otp_expired') {
      errorTitle = '링크 만료됨'
      errorMessage = '비밀번호 재설정 링크가 만료되었습니다'
    } else if (error === 'access_denied') {
      errorTitle = '접근 거부됨'
      errorMessage = '비밀번호 재설정 링크에 접근할 수 없습니다'
    } else if (errorCode === 'invalid_request') {
      errorTitle = '잘못된 요청'
      errorMessage = '비밀번호 재설정 링크가 올바르지 않습니다'
    }

    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {errorTitle}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {errorMessage}
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              새로운 비밀번호 재설정 이메일을 요청해주세요
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">💡 문제 해결 방법</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 이메일의 링크를 다시 한 번 확인해주세요</li>
              <li>• 링크를 복사해서 브라우저에 붙여넣기 해보세요</li>
              <li>• 24시간이 지난 링크는 만료됩니다</li>
              <li>• 스팸함도 확인해보세요</li>
              <li>• 브라우저를 새로고침해보세요</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">🔧 기술적 문제인 경우</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 개발자 도구 콘솔을 확인해주세요 (F12)</li>
              <li>• 브라우저 캐시를 삭제해보세요</li>
              <li>• 다른 브라우저로 시도해보세요</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link href="/forgot-password">
              <Button className="w-full">
                비밀번호 찾기
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                로그인으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 성공 화면
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              비밀번호 변경 완료
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              비밀번호가 성공적으로 변경되었습니다
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              잠시 후 로그인 페이지로 이동합니다
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">변경 완료</h3>
            <p className="text-sm text-green-800">
              새 비밀번호로 로그인할 수 있습니다. 보안을 위해 다른 기기에서 로그아웃됩니다.
            </p>
          </div>

          <Link href="/login">
            <Button className="w-full">
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 비밀번호 재설정 폼
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            새 비밀번호 설정
          </h2>
          {currentUser && (
            <p className="mt-2 text-center text-sm text-blue-600 font-medium">
              {currentUser}
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            새로운 비밀번호를 입력해주세요
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            최소 6자 이상의 안전한 비밀번호를 사용하세요
          </p>
          <p className="mt-1 text-center text-xs text-red-500">
            ⚠️ 기존 비밀번호와 다른 비밀번호를 사용해주세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                새 비밀번호
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="기존 비밀번호와 다른 새 비밀번호를 입력하세요"
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                새 비밀번호 확인
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  비밀번호 변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
