'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TermsConsentModal } from '@/components/ui/terms-consent-modal'
import { useAuth } from '@/hooks/use-auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Eye, EyeOff, Lock, Mail, User, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Zod 스키마 정의
const signupSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
  termsConsent: z.boolean().refine(val => val === true, {
    message: "이용약관 및 개인정보처리방침에 동의해야 합니다."
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const searchParams = useSearchParams()
  const isAdminSignup = searchParams.get('type') === 'admin'
  const router = useRouter()

  // 관리자 회원가입 시도 시 관리자 회원가입 페이지로 리다이렉트
  if (isAdminSignup) {
    router.push('/admin/signup')
    return null
  }

  const { signUpWithEmail, user, loading: authLoading } = useAuth('user')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [termsConsented, setTermsConsented] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      termsConsent: false
    }
  })

  const watchedEmail = watch('email')

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/home')
    }
  }, [user, authLoading, router])

  // 이메일 중복 확인
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (!watchedEmail || watchedEmail.length < 3) {
        setEmailStatus('idle')
        return
      }

      setEmailStatus('checking')

      try {
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(watchedEmail)) {
          setEmailStatus('idle')
          return
        }

        // API를 통해 이메일 중복 확인
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: watchedEmail }),
        })

        const data = await response.json()

        if (response.ok) {
          if (data.isTaken) {
            console.log('⚠️ 이미 가입된 이메일:', watchedEmail)
            setEmailStatus('taken')
          } else {
            console.log('✅ 사용 가능한 이메일:', watchedEmail)
            setEmailStatus('available')
          }
        } else {
          console.error('❌ 이메일 중복 확인 실패:', data.error)
          setEmailStatus('idle')
        }
      } catch (error) {
        console.error('❌ 이메일 중복 확인 중 오류:', error)
        setEmailStatus('idle')
      }
    }

    const timeoutId = setTimeout(checkEmailAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedEmail])

  const handleTermsConsent = (consentData: {
    allConsent: boolean
    serviceTerms: boolean
    privacyPolicy: boolean
    marketingConsent: boolean
  }) => {
    const isRequiredConsentsGiven = consentData.serviceTerms && consentData.privacyPolicy
    setTermsConsented(isRequiredConsentsGiven)
    setValue('termsConsent', isRequiredConsentsGiven)
  }

  const onSubmit = async (data: SignupFormData) => {
    // 이메일 중복 확인
    if (emailStatus === 'taken') {
      toast.error('이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.')
      return
    }

    // 이메일 검증 중인 경우 대기
    if (emailStatus === 'checking') {
      toast.error('이메일 중복 검사 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 회원가입 시도:', { email: data.email, name: data.name })

      const { data: result, error } = await signUpWithEmail(data.email, data.password, data.name)

      if (error) {
        console.error('❌ 회원가입 실패:', error)
        toast.error(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
        return
      }

      if (result?.user) {
        console.log('✅ 회원가입 성공:', result.user.email)
        toast.success('회원가입이 완료되었습니다! 이메일 인증을 완료해주세요.', {
          description: '인증 메일이 발송되었습니다. 스팸함도 확인해주세요.'
        })

        // 인증 코드 페이지로 이동
        router.push(`/verify?email=${encodeURIComponent(data.email)}`)
      } else {
        console.log('⚠️ 회원가입 데이터 없음:', result)
        toast.error('회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 회원가입 중 오류:', error)
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Neimd 계정을 만들어보세요
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('name')}
                  type="text"
                  placeholder="이름을 입력하세요"
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className={`pl-10 ${emailStatus === 'available' ? 'border-green-500' : emailStatus === 'taken' ? 'border-red-500' : errors.email ? 'border-red-500' : ''}`}
                />
                {emailStatus === 'checking' && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </span>
                )}
                {emailStatus === 'available' && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                )}
                {emailStatus === 'taken' && (
                  <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
              {emailStatus === 'available' && (
                <p className="text-green-500 text-sm">사용 가능한 이메일입니다</p>
              )}
              {emailStatus === 'taken' && (
                <div className="text-red-500 text-sm">
                  <p>이미 사용 중인 이메일입니다</p>
                  <p className="text-xs text-gray-500 mt-1">
                    로그인을 시도하거나 다른 이메일을 사용해주세요
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 약관 동의 체크박스 */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <label className="relative mt-1">
                  <input
                    {...register('termsConsent')}
                    type="checkbox"
                    checked={termsConsented}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIsTermsModalOpen(true)
                      } else {
                        setTermsConsented(false)
                        setValue('termsConsent', false)
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    termsConsented
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {termsConsented && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-purple-600 hover:text-purple-500 font-medium underline"
                  >
                    이용약관 및 개인정보처리방침 동의
                  </button>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-gray-500 text-xs mt-1">
                    필수 약관에 동의해야 합니다
                  </p>
                </div>
              </div>
              {errors.termsConsent && (
                <p className="text-red-500 text-sm ml-8">{errors.termsConsent.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading || isSubmitting || emailStatus === 'checking' || emailStatus === 'taken' || !termsConsented}
            >
              {loading ? '회원가입 중...' :
               emailStatus === 'taken' ? '이미 가입된 이메일' :
               emailStatus === 'checking' ? '이메일 확인 중...' :
               !termsConsented ? '약관 동의 필요' : '회원가입'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                로그인
              </Link>
            </p>
            {emailStatus === 'taken' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 이미 가입된 이메일이네요!{' '}
                  <Link href="/login" className="font-medium underline">
                    로그인 페이지로 이동
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 약관 동의 모달 */}
        <TermsConsentModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onConsent={handleTermsConsent}
        />
      </div>
    </div>
  )
}
