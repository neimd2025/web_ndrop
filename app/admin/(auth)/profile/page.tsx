"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { ArrowLeft, Eye, EyeOff, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminProfilePage() {
  const router = useRouter()
  const { admin, signOut } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const [formData, setFormData] = useState({
    name: admin?.name || "",
    email: admin?.username ? `${admin.username}@admin.local` : "",
    company: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  })

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
      // 실제로는 Supabase에 프로필 업데이트를 해야 함
      await new Promise(resolve => setTimeout(resolve, 1000)) // 시뮬레이션

      console.log('관리자 프로필 업데이트:', formData)

      setMessage("프로필이 성공적으로 업데이트되었습니다.")
      setMessageType("success")

      // 비밀번호 필드 초기화
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      }))

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
    router.push('/admin/login')
    return null
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
