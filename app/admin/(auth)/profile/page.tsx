"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { ArrowLeft, Camera, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export default function AdminProfilePage() {
  const router = useRouter()
  const { admin, signOut } = useAdminAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  // 프로필 이미지 업로드 관련 상태
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 프로필 이미지 업로드 함수
  const handleImageUpload = async (file: File) => {
    if (!admin) {
      toast.error('관리자 인증이 필요합니다.')
      return
    }

    setIsUploadingImage(true)

    try {
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

      const formData = new FormData()
      formData.append('file', file)

      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다.')
        return
      }

      const response = await fetch('/api/admin/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '이미지 업로드에 실패했습니다.')
      }

      setProfileImage(result.publicUrl)
      toast.success('프로필 이미지가 업로드되었습니다!')

    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    phone: "",
    introduction: ""
  })

  // 관리자 프로필 이미지 및 데이터 초기화
  useEffect(() => {
    if (admin) {
      // 관리자 프로필 이미지가 있다면 설정
      setProfileImage(admin.profile_image_url || null)

      // 관리자 데이터로 폼 초기화
      setFormData({
        name: admin.name || "",
        email: admin.email || (admin.username ? `${admin.username}@admin.local` : ""),
        company: admin.company || "",
        role: admin.role || "",
        phone: admin.phone || "",
        introduction: admin.introduction || ""
      })
    }
  }, [admin])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage("") // 메시지 초기화
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")

    setIsLoading(true)

    try {
      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        setMessage("인증 토큰이 없습니다. 다시 로그인해주세요.")
        setMessageType("error")
        return
      }

      // 관리자 프로필 업데이트 API 호출
      const response = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role,
          phone: formData.phone,
          introduction: formData.introduction,
          profile_image_url: profileImage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || "프로필 업데이트 중 오류가 발생했습니다.")
        setMessageType("error")
        return
      }

      setMessage(result.message || "프로필이 성공적으로 업데이트되었습니다.")
      setMessageType("success")

      // 로컬 스토리지와 쿠키의 관리자 정보도 업데이트
      const adminUser = localStorage.getItem('admin_user')
      if (adminUser) {
        const adminData = JSON.parse(adminUser)
        adminData.name = formData.name
        adminData.email = formData.email
        adminData.company = formData.company
        adminData.role = formData.role
        adminData.phone = formData.phone
        adminData.introduction = formData.introduction
        adminData.profile_image_url = profileImage
        localStorage.setItem('admin_user', JSON.stringify(adminData))

        // 쿠키도 업데이트
        document.cookie = `admin_user=${encodeURIComponent(JSON.stringify(adminData))}; path=/; max-age=604800`
      }

    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      setMessage("프로필 업데이트 중 오류가 발생했습니다.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    signOut()
    router.push('/admin/login')
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">프로필 설정</h1>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 프로필 사진 섹션 */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">프로필 사진</h2>

              <div className="flex flex-col items-center gap-4">
                {/* 프로필 이미지 */}
                <div className="relative">
                  <div
                    className="w-28 h-28 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
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
                        className="w-28 h-28 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-14 h-14 text-white" />
                    )}
                  </div>
                </div>

                {/* 사진 변경 버튼 */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-gray-300"
                    disabled={isUploadingImage}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (fileInputRef.current && !isUploadingImage) {
                        fileInputRef.current.click()
                      }
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    사진 변경
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 text-center">
                    JPG, PNG 파일만 가능합니다. 최대 10MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기본 정보 섹션 */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">기본 정보</h2>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* 이름 - 필수 */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="홍길동"
                    className="border-gray-300 rounded-xl"
                    required
                  />
                </div>

                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@example.com"
                    className="border-gray-300 rounded-xl"
                  />
                </div>

                {/* 회사/소속 */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-900">
                    회사/소속
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Neimed Network"
                    className="border-gray-300 rounded-xl"
                  />
                </div>

                {/* 직책 */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-900">
                    직책
                  </Label>
                  <Input
                    id="role"
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    placeholder="관리자"
                    className="border-gray-300 rounded-xl"
                  />
                </div>

                {/* 전화번호 */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                    전화번호
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="'-' 없이 숫자만 입력해주세요"
                    className="border-gray-300 rounded-xl"
                  />
                </div>

                {/* 소개 */}
                <div className="space-y-2">
                  <Label htmlFor="introduction" className="text-sm font-medium text-gray-900">
                    소개
                  </Label>
                  <Textarea
                    id="introduction"
                    value={formData.introduction}
                    onChange={(e) => handleInputChange("introduction", e.target.value)}
                    placeholder="간단한 소개를 입력해주세요"
                    className="border-gray-300 rounded-xl min-h-[120px] resize-none"
                  />
                </div>


                {/* 메시지 표시 */}
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    messageType === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {message}
                  </div>
                )}

                {/* 버튼 섹션 */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-gray-300"
                    disabled={isLoading}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isLoading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
