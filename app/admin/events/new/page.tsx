"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Calendar, Clock, Upload, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

// Zod 스키마 정의
const eventSchema = z.object({
  title: z.string().min(1, '이벤트 이름을 입력해주세요').max(100, '이벤트 이름은 100자 이하여야 합니다'),
  startDate: z.string().min(1, '시작 날짜를 입력해주세요'),
  startTime: z.string().min(1, '시작 시간을 입력해주세요'),
  endDate: z.string().min(1, '종료 날짜를 입력해주세요'),
  endTime: z.string().min(1, '종료 시간을 입력해주세요'),
  location: z.string().min(1, '장소를 입력해주세요').max(200, '장소는 200자 이하여야 합니다'),
  description: z.string().min(1, '이벤트 설명을 입력해주세요').max(1000, '이벤트 설명은 1000자 이하여야 합니다'),
  maxParticipants: z.string().min(1, '최대 참가자 수를 입력해주세요').refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 1000
  }, '최대 참가자 수는 1명 이상 1000명 이하여야 합니다'),

}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`)
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`)
  return endDateTime > startDateTime
}, {
  message: "종료 일시는 시작 일시보다 늦어야 합니다",
  path: ["endDate"],
})

type EventFormData = z.infer<typeof eventSchema>

export default function NewEventPage() {
  const router = useRouter()
  const { user: admin } = useAuth('admin')
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema)
  })

  // 관리자 권한 확인
  if (!admin) {
    router.push('/admin/login')
    return null
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File, eventCode: string, startDate: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()

      // 이벤트 코드와 날짜를 포함한 구조화된 경로 생성
      const dateStr = startDate.replace(/-/g, '') // YYYYMMDD 형식
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, -5) // YYYYMMDDTHHMMSS 형식

      const fileName = `${eventCode}_${dateStr}_${timestamp}.${fileExt}`
      const filePath = `events/${eventCode}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('이미지 업로드 오류:', uploadError)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      return null
    }
  }

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // 이벤트 코드 자동 생성
      const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      // 한국 시간으로 저장 (UTC 변환 없이)
      const startDateTime = `${data.startDate}T${data.startTime}:00+09:00`
      const endDateTime = `${data.endDate}T${data.endTime}:00+09:00`

      // 이미지 업로드 (이벤트 코드 생성 후)
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, eventCode, data.startDate)
      }

      // 이벤트 생성
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.description,
          start_date: startDateTime,
          end_date: endDateTime,
          location: data.location,
          max_participants: parseInt(data.maxParticipants),
          event_code: eventCode,
          image_url: imageUrl,
          organizer_name: admin.user_metadata?.full_name || admin.email?.split('@')[0] || '관리자',
          organizer_email: admin.email || 'support@neimed.com',
          organizer_phone: admin.user_metadata?.phone || '02-1234-5678',
          organizer_kakao: admin.user_metadata?.kakao || '@neimed_official',
          created_by: admin.id,
          status: 'upcoming',
          current_participants: 0
        })
        .select()
        .single()

      if (eventError) {
        console.error('이벤트 생성 오류:', eventError)
        toast.error("이벤트 생성 중 오류가 발생했습니다.")
        return
      }

      console.log('이벤트 생성 성공:', event)
      toast.success('이벤트가 성공적으로 생성되었습니다!')

      // 성공 시 이벤트 목록으로 이동
      router.push('/admin/events')
    } catch (error) {
      console.error('이벤트 생성 오류:', error)
      toast.error("이벤트 생성 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">새로운 이벤트 만들기</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">이벤트 이름</Label>
                <Input
                  {...register('title')}
                  placeholder="예: Neimd 네트워킹 데모 이벤트"
                  className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

              {/* 시작 일시 */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-medium">시작 일시</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="startDate" className="text-sm">날짜</Label>
                    </div>
                    <Input
                      {...register('startDate')}
                      type="date"
                      className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.startDate ? 'border-red-500' : ''}`}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-sm">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="startTime" className="text-sm">시간</Label>
                    </div>
                    <Input
                      {...register('startTime')}
                      type="time"
                      className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.startTime ? 'border-red-500' : ''}`}
                    />
                    {errors.startTime && (
                      <p className="text-red-500 text-sm">{errors.startTime.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 종료 일시 */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-medium">종료 일시</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="endDate" className="text-sm">날짜</Label>
                    </div>
                    <Input
                      {...register('endDate')}
                      type="date"
                      className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.endDate ? 'border-red-500' : ''}`}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="endTime" className="text-sm">시간</Label>
                    </div>
                    <Input
                      {...register('endTime')}
                      type="time"
                      className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.endTime ? 'border-red-500' : ''}`}
                    />
                    {errors.endTime && (
                      <p className="text-red-500 text-sm">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">장소</Label>
                <Input
                  {...register('location')}
                  placeholder="예: 온라인 또는 서울시 강남구"
                  className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.location ? 'border-red-500' : ''}`}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">최대 참가자 수</Label>
                <Input
                  {...register('maxParticipants')}
                  type="number"
                  placeholder="예: 100"
                  className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl ${errors.maxParticipants ? 'border-red-500' : ''}`}
                />
                {errors.maxParticipants && (
                  <p className="text-red-500 text-sm">{errors.maxParticipants.message}</p>
                )}
              </div>



              <div className="space-y-2">
                <Label htmlFor="description">이벤트 설명</Label>
                <Textarea
                  {...register('description')}
                  placeholder="이벤트에 대한 상세한 설명을 입력하세요"
                  className={`border-2 border-gray-200 focus:border-purple-500 rounded-xl min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 이벤트 이미지 업로드 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Label className="text-gray-700 font-medium mb-4 block">이벤트 이미지</Label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="이벤트 이미지 미리보기"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 bg-white"
                    >
                      변경
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">이벤트 이미지를 업로드하세요</p>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG, GIF 최대 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

                    {/* 주최자 정보 안내 */}
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">주최자 정보</h3>
                  <p className="text-sm text-blue-700">이벤트 생성자의 정보가 자동으로 설정됩니다</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>이름:</strong> {admin.user_metadata?.full_name || admin.email?.split('@')[0] || '관리자'}</p>
                <p><strong>이메일:</strong> {admin.email || 'support@neimed.com'}</p>
                <p><strong>연락처:</strong> {admin.user_metadata?.phone || '02-1234-5678'}</p>
                {admin.user_metadata?.kakao && (
                  <p><strong>카카오톡:</strong> {admin.user_metadata.kakao}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 border-2 border-gray-200 py-3 rounded-xl"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "생성 중..." : "이벤트 생성"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
