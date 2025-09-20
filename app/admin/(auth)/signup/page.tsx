"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuthStore } from "@/stores/admin-auth-store"
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, Lock, Mail, User, X, ArrowUpCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

// Zod 스키마 정의
const adminSignupSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

type AdminSignupFormData = z.infer<typeof adminSignupSchema>

type EmailStatus = 'idle' | 'checking' | 'new_admin' | 'can_upgrade' | 'already_admin'

export default function AdminSignupPage() {
  const router = useRouter()
  const { signUpWithEmail, signInWithOAuth } = useAdminAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [requiresPassword, setRequiresPassword] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<AdminSignupFormData>({
    resolver: zodResolver(adminSignupSchema)
  })

  const watchedEmail = watch('email')

  // 이메일 상태 확인
  const checkEmailStatus = async (email: string) => {
    if (!email || !email.includes('@')) return

    setEmailStatus('checking')
    setEmailMessage('')

    try {
      const response = await fetch('/api/auth/admin-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, method: 'check' })
      })

      const data = await response.json()

      if (data.status === 'new_admin') {
        setEmailStatus('new_admin')
        setEmailMessage('새로운 관리자 계정을 생성할 수 있습니다.')
        setRequiresPassword(true)
      } else if (data.status === 'can_upgrade') {
        setEmailStatus('can_upgrade')
        setEmailMessage('기존 계정을 관리자로 업그레이드할 수 있습니다.')
        setRequiresPassword(false)
      } else if (data.status === 'already_admin') {
        setEmailStatus('already_admin')
        setEmailMessage('이미 관리자 계정입니다.')
        setRequiresPassword(false)
      }
    } catch (error) {
      console.error('이메일 확인 오류:', error)
      setEmailStatus('idle')
      setEmailMessage('이메일 확인 중 오류가 발생했습니다.')
    }
  }

  // 이메일 변경 시 상태 확인
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedEmail && watchedEmail.includes('@')) {
        checkEmailStatus(watchedEmail)
      } else {
        setEmailStatus('idle')
        setEmailMessage('')
        setRequiresPassword(true)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [watchedEmail])

  const onSubmit = async (data: AdminSignupFormData) => {
    if (emailStatus === 'already_admin') {
      toast.error('이미 관리자 계정입니다.')
      return
    }

    setIsSubmitting(true)

    try {
      if (emailStatus === 'can_upgrade') {
        // 기존 계정을 관리자로 업그레이드
        const response = await fetch('/api/auth/admin-upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            method: 'upgrade'
          })
        })

        const result = await response.json()

        if (!response.ok) {
          toast.error(result.error || '업그레이드에 실패했습니다.')
          return
        }

        toast.success('성공적으로 관리자로 업그레이드되었습니다!')
        router.push('/admin/login')
      } else if (emailStatus === 'new_admin') {
        // 새 관리자 계정 생성
        const { data: result, error } = await signUpWithEmail(data.email, data.password, data.name)

        if (error) {
          if (error.code === 'USER_EXISTS_CAN_UPGRADE') {
            // 업그레이드 가능한 경우 자동으로 상태 변경
            setEmailStatus('can_upgrade')
            setEmailMessage('기존 계정을 관리자로 업그레이드할 수 있습니다.')
            setRequiresPassword(false)
            toast.info('기존 계정을 발견했습니다. 업그레이드 버튼을 클릭해주세요.')
            return
          } else {
            toast.error(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
            return
          }
        }

        if (result?.user) {
          toast.success('관리자 계정이 성공적으로 생성되었습니다! 이메일 인증을 완료해주세요.', {
            description: '💡 이메일 인증 링크를 클릭한 후 로그인해주세요.'
          })
          router.push('/admin/login')
        }
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithOAuth('google')
      if (error) {
        toast.error('Google 로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error)
      toast.error('Google 로그인 중 오류가 발생했습니다.')
    }
  }

  const getStatusIcon = () => {
    switch (emailStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
      case 'new_admin':
        return <Check className="h-4 w-4 text-green-500" />
      case 'can_upgrade':
        return <ArrowUpCircle className="h-4 w-4 text-blue-500" />
      case 'already_admin':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (emailStatus) {
      case 'new_admin':
        return 'border-green-500'
      case 'can_upgrade':
        return 'border-blue-500'
      case 'already_admin':
        return 'border-red-500'
      default:
        return ''
    }
  }

  const getMessageColor = () => {
    switch (emailStatus) {
      case 'new_admin':
        return 'text-green-600'
      case 'can_upgrade':
        return 'text-blue-600'
      case 'already_admin':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getButtonText = () => {
    if (isSubmitting) {
      return emailStatus === 'can_upgrade' ? '업그레이드 중...' : '회원가입 중...'
    }
    if (emailStatus === 'already_admin') {
      return '이미 관리자임'
    }
    if (emailStatus === 'checking') {
      return '이메일 확인 중...'
    }
    if (emailStatus === 'can_upgrade') {
      return '관리자로 업그레이드'
    }
    return '관리자 회원가입'
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 계정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자 계정을 생성하거나 기존 계정을 업그레이드하세요
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <div>
          <Button
            type="button"
            onClick={handleGoogleSignup}
            variant="outline"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  placeholder="관리자 이름"
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@neimd.com"
                  className={`pl-10 pr-10 ${errors.email ? 'border-red-500' : ''} ${getStatusColor()}`}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getStatusIcon()}
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
              {emailMessage && (
                <p className={`text-sm mt-1 ${getMessageColor()}`}>
                  {emailMessage}
                </p>
              )}
            </div>

            {requiresPassword && emailStatus !== 'already_admin' && (
              <>
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    비밀번호
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="비밀번호를 입력하세요"
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
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="비밀번호를 다시 입력하세요"
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
              </>
            )}
          </div>

          <div>
            <Button
              type="submit"
              className={`w-full ${
                emailStatus === 'can_upgrade' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
              disabled={isSubmitting || emailStatus === 'already_admin' || emailStatus === 'checking'}
            >
              {getButtonText()}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 관리자 계정이 있으신가요?{' '}
              <Link href="/admin/login" className="font-medium text-purple-600 hover:text-purple-500">
                관리자 로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}