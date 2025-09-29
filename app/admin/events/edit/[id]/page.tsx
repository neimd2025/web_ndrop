"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

// Zod 스키마 정의 (생성과 동일)
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
  // 새로운 필드들
  overviewPoints: z.string().optional(),
  targetAudience: z.string().optional(),
  specialBenefits: z.string().optional(),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`)
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`)
  return endDateTime > startDateTime
}, {
  message: "종료 일시는 시작 일시보다 늦어야 합니다",
  path: ["endTime"]
})

type EventFormData = z.infer<typeof eventSchema>

interface EventData {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  current_participants: number
  event_code: string
  image_url?: string
  organizer_name?: string
  organizer_email?: string
  organizer_phone?: string
  organizer_kakao?: string
  overview_points?: string[]
  target_audience?: string[]
  special_benefits?: string[]
}

export default function AdminEventEditPage() {
  const router = useRouter()
  const params = useParams()
  const { admin } = useAdminAuth()
  const [loading, setLoading] = useState(false)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema)
  })

  // 이벤트 데이터 로드
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setEventLoading(true)
        const eventId = params.id as string

        // JWT 토큰 가져오기
        const adminToken = localStorage.getItem('admin_token')
        if (!adminToken) {
          toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
          router.push('/admin/login')
          return
        }

        // 이벤트 데이터 조회
        const response = await fetch(`/api/admin/get-events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('이벤트 조회 오류:', result)
          toast.error(result.error || '이벤트를 불러오는데 실패했습니다.')
          router.push('/admin/events')
          return
        }

        // 특정 이벤트 찾기
        const event = result.events?.find((e: EventData) => e.id === eventId)
        if (!event) {
          toast.error('이벤트를 찾을 수 없습니다.')
          router.push('/admin/events')
          return
        }

        setEventData(event)

        // 폼 데이터 설정
        const startDate = new Date(event.start_date)
        const endDate = new Date(event.end_date)

        setValue('title', event.title)
        setValue('startDate', startDate.toISOString().split('T')[0])
        setValue('startTime', startDate.toTimeString().slice(0, 5))
        setValue('endDate', endDate.toISOString().split('T')[0])
        setValue('endTime', endDate.toTimeString().slice(0, 5))
        setValue('location', event.location)
        setValue('description', event.description)
        setValue('maxParticipants', event.max_participants.toString())

        // 배열 필드들을 문자열로 변환
        setValue('overviewPoints', event.overview_points?.join('\n') || '')
        setValue('targetAudience', event.target_audience?.join('\n') || '')
        setValue('specialBenefits', event.special_benefits?.join('\n') || '')

        // 이미지 미리보기 설정
        if (event.image_url) {
          setImagePreview(event.image_url)
        }

      } catch (error) {
        console.error('이벤트 데이터 로드 오류:', error)
        toast.error('이벤트 데이터를 불러오는 중 오류가 발생했습니다.')
        router.push('/admin/events')
      } finally {
        setEventLoading(false)
      }
    }

    if (params.id) {
      loadEventData()
    }
  }, [params.id, setValue, router])

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 확인 (5MB 제한)
      const maxSize = 5 * 1024 * 1024
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

      setImageFile(file)

      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 폼 제출 핸들러
  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true)

      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      // 이미지 업로드 (새 이미지가 있는 경우)
      let imageUrl = eventData?.image_url || null
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadResponse = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: formData
        })

        const uploadResult = await uploadResponse.json()
        if (uploadResponse.ok) {
          imageUrl = uploadResult.publicUrl
        } else {
          toast.error('이미지 업로드에 실패했습니다.')
          return
        }
      }

      // 날짜/시간 조합
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString()
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString()

      // 배열 필드 처리
      const overviewPoints = data.overviewPoints
        ? data.overviewPoints.split('\n').filter(point => point.trim())
        : null
      const targetAudience = data.targetAudience
        ? data.targetAudience.split('\n').filter(audience => audience.trim())
        : null
      const specialBenefits = data.specialBenefits
        ? data.specialBenefits.split('\n').filter(benefit => benefit.trim())
        : null

      // 이벤트 업데이트 API 호출
      const updateResponse = await fetch(`/api/admin/update-event/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          start_date: startDateTime,
          end_date: endDateTime,
          location: data.location,
          max_participants: parseInt(data.maxParticipants),
          image_url: imageUrl,
          organizer_name: admin?.name || 'ndrop 팀',
          organizer_email: admin?.email || 'support@ndrop.com',
          organizer_phone: admin?.phone || '02-1234-5678',
          organizer_kakao: '@ndrop_official',
          overview_points: overviewPoints,
          target_audience: targetAudience,
          special_benefits: specialBenefits
        })
      })

      const updateResult = await updateResponse.json()

      if (!updateResponse.ok) {
        console.error('이벤트 수정 오류:', updateResult)
        toast.error(updateResult.error || '이벤트 수정에 실패했습니다.')
        return
      }

      toast.success('이벤트가 성공적으로 수정되었습니다!')
      router.push('/admin/events')

    } catch (error) {
      console.error('이벤트 수정 오류:', error)
      toast.error('이벤트 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이벤트 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">이벤트를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 이벤트가 존재하지 않거나 삭제되었습니다.</p>
          <Button onClick={() => router.push('/admin/events')}>
            이벤트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">이벤트 수정</h1>
            <p className="text-sm text-gray-600">{eventData.title}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">이벤트 이름 *</Label>
                      <Input
                        id="title"
                        {...register('title')}
                        placeholder="이벤트 이름을 입력하세요"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">장소 *</Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="장소를 입력하세요"
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && (
                        <p className="text-sm text-red-600">{errors.location.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">이벤트 설명 *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="이벤트에 대한 자세한 설명을 입력하세요"
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                {/* 일정 정보 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">일정 정보</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">시작 날짜 *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">시작 시간 *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        {...register('startTime')}
                        className={errors.startTime ? 'border-red-500' : ''}
                      />
                      {errors.startTime && (
                        <p className="text-sm text-red-600">{errors.startTime.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">종료 날짜 *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">종료 시간 *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        {...register('endTime')}
                        className={errors.endTime ? 'border-red-500' : ''}
                      />
                      {errors.endTime && (
                        <p className="text-sm text-red-600">{errors.endTime.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 참가자 정보 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">참가자 정보</h2>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">최대 참가자 수 *</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      max="1000"
                      {...register('maxParticipants')}
                      placeholder="100"
                      className={errors.maxParticipants ? 'border-red-500' : ''}
                    />
                    {errors.maxParticipants && (
                      <p className="text-sm text-red-600">{errors.maxParticipants.message}</p>
                    )}
                  </div>
                </div>

                {/* 이벤트 이미지 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">이벤트 이미지</h2>

                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="이벤트 이미지 미리보기"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="image" className="cursor-pointer">
                        <div className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">
                            {imageFile ? '이미지가 선택되었습니다' : '이벤트 이미지를 업로드하세요'}
                          </span>
                        </div>
                      </Label>
                      <input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, WebP 파일만 가능합니다. 최대 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* 동적 콘텐츠 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">동적 콘텐츠</h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="overviewPoints">이벤트 개요 포인트</Label>
                      <Textarea
                        id="overviewPoints"
                        {...register('overviewPoints')}
                        placeholder="각 포인트를 새 줄로 구분하여 입력하세요"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">예: 네트워킹 기회 제공, 전문가 강연, 실무 경험 공유</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">대상 청중</Label>
                      <Textarea
                        id="targetAudience"
                        {...register('targetAudience')}
                        placeholder="대상 청중을 새 줄로 구분하여 입력하세요"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">예: 신입 개발자, 경력 3-5년 개발자, 프론트엔드 개발자</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialBenefits">특별 혜택</Label>
                      <Textarea
                        id="specialBenefits"
                        {...register('specialBenefits')}
                        placeholder="특별 혜택을 새 줄로 구분하여 입력하세요"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">예: 선착순 10명 스타벅스 기프티콘, 이벤트 한정 굿즈 증정</p>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    disabled={loading}
                  >
                    {loading ? '수정 중...' : '이벤트 수정'}
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
