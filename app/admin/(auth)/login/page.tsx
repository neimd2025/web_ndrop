"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, User } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

const adminLoginSchema = z.object({
  username: z.string().min(3, '아이디은 3자 이상이어야 합니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const returnTo = searchParams.get('returnTo') || '/admin'

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema)
  })


  // 새로운 관리자 인증 상태 확인
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const adminToken = localStorage.getItem('admin_token')
        const adminUser = localStorage.getItem('admin_user')

        console.log('🔍 관리자 인증 확인:', {
          hasToken: !!adminToken,
          hasUser: !!adminUser,
          returnTo
        })

        if (adminToken && adminUser) {
          const userData = JSON.parse(adminUser)
          console.log('👤 관리자 데이터:', userData)

          if (userData.role_id === 2) {
            console.log('✅ 관리자 로그인 상태 확인됨:', userData.username)
            router.push(returnTo)
            return
          } else {
            console.log('❌ 관리자 권한 없음:', userData.role_id)
          }
        } else {
          console.log('❌ 토큰 또는 사용자 데이터 없음')
        }
      } catch (error) {
        console.error('관리자 데이터 파싱 오류:', error)
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      } finally {
        console.log('✅ 인증 확인 완료')
        setIsCheckingAuth(false)
      }
    }

    checkAdminAuth()
  }, [router, returnTo])

  const onSubmit = async (data: AdminLoginFormData) => {
    console.log('🚀 onSubmit 함수 호출됨:', data)
    console.log('🔍 handleSubmit이 정상적으로 작동하는지 확인')
    setIsSubmitting(true)
    try {
      // 새로운 관리자 전용 API 사용
      const response = await fetch('/api/auth/admin-simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '로그인에 실패했습니다. 아이디과 비밀번호를 확인해주세요.')
        return
      }

      if (result.success) {
        // JWT 토큰을 localStorage와 쿠키에 저장
        localStorage.setItem('admin_token', result.token)
        localStorage.setItem('admin_user', JSON.stringify(result.admin))

        // 쿠키에도 저장 (미들웨어에서 사용) - localhost에서는 secure 제거
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const secureFlag = isLocalhost ? '' : '; secure'
        document.cookie = `admin_token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}${secureFlag}; samesite=strict`
        document.cookie = `admin_user=${encodeURIComponent(JSON.stringify(result.admin))}; path=/; max-age=${7 * 24 * 60 * 60}${secureFlag}; samesite=strict`

        toast.success('관리자로 로그인되었습니다.')
        router.push(returnTo)
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      toast.error('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    toast.success('로그아웃되었습니다.')
    router.push('/admin/login')
  }

  // 로딩 상태 처리
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-2xl font-bold text-gray-800">인증 상태 확인 중...</h2>
          <p className="text-gray-600">잠시만 기다려 주세요.</p>
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


        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700">
                아이디
              </Label>
              <div className="mt-1 relative">
                <Input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
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
              type="button"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
              onClick={async () => {
                console.log('🚀 로그인 버튼 클릭됨!');
                const form = document.querySelector('form');
                if (form) {
                  const formData = new FormData(form);
                  const data = {
                    username: formData.get('username') as string,
                    password: formData.get('password') as string
                  };
                  console.log('📝 폼 데이터:', data);
                  await onSubmit(data);
                }
              }}
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
