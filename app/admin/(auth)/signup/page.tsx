"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

// Zod 스키마 정의
const adminSignupSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  username: z.string().min(3, '사용자명은 3자 이상이어야 합니다').max(20, '사용자명은 20자 이하여야 합니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

type AdminSignupFormData = z.infer<typeof adminSignupSchema>

export default function AdminSignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminSignupFormData>({
    resolver: zodResolver(adminSignupSchema)
  })

  const onSubmit = async (data: AdminSignupFormData) => {
    setIsSubmitting(true)

    try {
      // 새로운 관리자 전용 API 사용
      const response = await fetch('/api/auth/admin-simple-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          name: data.name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '관리자 회원가입에 실패했습니다. 다시 시도해주세요.')
        return
      }

      if (result.success) {
        toast.success('관리자 계정이 성공적으로 생성되었습니다!', {
          description: '💡 바로 로그인하실 수 있습니다.'
        })
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 계정 생성
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            새로운 관리자 계정을 생성하세요
          </p>
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
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700">
                사용자명
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
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '회원가입 중...' : '관리자 회원가입'}
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
