"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { ArrowLeft, Camera, Eye, EyeOff, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export default function AdminProfilePage() {
  const router = useRouter()
  const { admin, signOut } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
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
    name: admin?.name || "",
    email: admin?.username ? `${admin.username}@admin.local` : "",
    company: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  })

  // 관리자 프로필 이미지 초기화
  useEffect(() => {
    if (admin) {
      // 관리자 프로필 이미지가 있다면 설정
      setProfileImage((admin as any).profile_image_url || null)
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

    // 비밀번호 변경 시 유효성 검사
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setMessage("새 비밀번호가 일치하지 않습니다.")
        setMessageType("error")
        return
      }

      if (formData.newPassword.length < 6) {
        setMessage("새 비밀번호는 최소 6자 이상이어야 합니다.")
        setMessageType("error")
        return
      }

      if (!formData.currentPassword) {
        setMessage("현재 비밀번호를 입력해주세요.")
        setMessageType("error")
        return
      }
    }

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
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
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

      // 비밀번호 필드 초기화
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      }))

      // 로컬 스토리지의 관리자 정보도 업데이트
      const adminUser = localStorage.getItem('admin_user')
      if (adminUser) {
        const adminData = JSON.parse(adminUser)
        adminData.name = formData.name
        localStorage.setItem('admin_user', JSON.stringify(adminData))
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">관리자 프로필</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
            로그아웃
          </Button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 현재 관리자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>현재 관리자 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 프로필 이미지 섹션 */}
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className="relative w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
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
                    <User className="w-10 h-10 text-gray-600" />
                  )}
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (fileInputRef.current && !isUploadingImage) {
                        fileInputRef.current.click()
                      }
                    }}
                    disabled={isUploadingImage}
                  >
                    <Camera className="w-3 h-3 text-white" />
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">프로필 이미지</p>
                  <p className="text-xs text-gray-500">
                    {isUploadingImage ? '업로드 중...' : '클릭하여 이미지 변경'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">이름</Label>
                  <p className="text-gray-900 font-medium">{admin.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">사용자명</Label>
                  <p className="text-gray-900 font-medium">{admin.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">이메일</Label>
                  <p className="text-gray-900 font-medium">{admin.username}@admin.local</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">회사/조직</Label>
                  <p className="text-gray-900 font-medium">-</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">권한</Label>
                  <p className="text-gray-900 font-medium">관리자</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 프로필 수정 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>프로필 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      이름
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-700 font-medium">
                      회사/조직
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                    />
                  </div>
                </div>

                {/* 비밀번호 변경 섹션 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
                        현재 비밀번호
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg pr-12"
                          placeholder="변경 시에만 입력"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                        새 비밀번호
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange("newPassword", e.target.value)}
                          className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg pr-12"
                          placeholder="변경 시에만 입력"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-gray-700 font-medium">
                        새 비밀번호 확인
                      </Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={formData.confirmNewPassword}
                        onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)}
                        className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                        placeholder="새 비밀번호를 다시 입력"
                      />
                    </div>
                  </div>
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

                <Button
                  type="submit"
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      업데이트 중...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      프로필 업데이트
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
