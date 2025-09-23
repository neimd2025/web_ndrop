"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Eye, EyeOff, Lock, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
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

  // 프로필 이미지 업로드 관련 상태
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 프로필 이미지 업로드 함수
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 확인 (5MB 제한)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error('파일 크기는 5MB를 초과할 수 없습니다.')
        return
      }

      // 파일 형식 확인
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 허용)')
        return
      }

      // 파일 저장 및 미리보기용 URL 생성
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
      // 1. 먼저 관리자 계정 생성
      const signupResponse = await fetch('/api/auth/admin-simple-signup', {
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

      const signupResult = await signupResponse.json()

      if (!signupResponse.ok) {
        toast.error(signupResult.error || '관리자 회원가입에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // 2. 프로필 이미지가 있다면 업로드
      if (profileImageFile && signupResult.admin) {
        setIsUploadingImage(true)

        try {
          const formData = new FormData()
          formData.append('file', profileImageFile)
          formData.append('adminId', signupResult.admin.id)

          const imageResponse = await fetch('/api/admin/upload-profile-image', {
            method: 'POST',
            body: formData
          })

          const imageResult = await imageResponse.json()

          if (!imageResponse.ok) {
            console.warn('프로필 이미지 업로드 실패:', imageResult.error)
            // 이미지 업로드 실패해도 회원가입은 성공으로 처리
          }
        } catch (imageError) {
          console.warn('프로필 이미지 업로드 오류:', imageError)
          // 이미지 업로드 실패해도 회원가입은 성공으로 처리
        } finally {
          setIsUploadingImage(false)
        }
      }

      if (signupResult.success) {
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
          {/* 프로필 이미지 섹션 */}
          <div className="text-center mb-6">
            <div
              className="relative w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (fileInputRef.current && !isUploadingImage) {
                  fileInputRef.current.click()
                }
              }}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-600" />
              )}
              <Button
                type="button"
                size="sm"
                className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (fileInputRef.current && !isUploadingImage) {
                    fileInputRef.current.click()
                  }
                }}
                disabled={isUploadingImage}
              >
                <Camera className="w-4 h-4 text-white" />
              </Button>
            </div>
            <p className="text-purple-600 text-sm font-medium">
              {isUploadingImage ? '업로드 중...' : '프로필 사진 추가(선택)'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

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
