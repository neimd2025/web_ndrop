"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, LogOut, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

const adminLoginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin, adminLoading, signInWithEmail, signInWithOAuth, signOut } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema)
  })

  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      router.push('/admin/events')
    }
  }, [isAdmin, authLoading, adminLoading, router])

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsSubmitting(true)
    try {
      const { data: result, error } = await signInWithEmail(data.email, data.password)
      if (error) {
        toast.error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
        return
      }
      if (result?.user) {
        toast.success('로그인되었습니다.')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      toast.error('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      // 관리자 로그인 페이지에서 Google 로그인 시 관리자 페이지로 리다이렉트
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('returnTo', '/admin/events')

      const { error } = await signInWithOAuth('google')
      if (error) {
        toast.error('Google 로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error)
      toast.error('Google 로그인 중 오류가 발생했습니다.')
    }
  }

  // 로딩 상태 렌더링
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 일반 사용자 로그인 상태 렌더링
  if (user && !isAdmin && !authLoading && !adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              관리자 권한 필요
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              현재 일반 사용자로 로그인되어 있습니다
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
              {user.email}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={async () => {
                await signOut()
                toast.success('로그아웃되었습니다.')
              }}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                관리자 계정으로 다시 로그인하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 관리자 로그인 폼 렌더링
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자 계정으로 로그인하세요
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <div>
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 로그인
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
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@neimd.com"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              관리자 계정이 없으신가요?{' '}
              <Link href="/admin/signup" className="font-medium text-purple-600 hover:text-purple-500">
                관리자 회원가입
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link href="/forgot-password" className="font-medium text-purple-600 hover:text-purple-500">
                비밀번호를 잊으셨나요?
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
