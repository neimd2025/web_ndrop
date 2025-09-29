'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { userProfileAPI } from '@/lib/supabase/database'
import { createClient } from '@/utils/supabase/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Zod 스키마 정의
const profileSchema = z.object({
  full_name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  birth_date: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    if (val === '123123123') return false
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, '올바른 날짜 형식을 입력해주세요'),
  affiliation_type: z.enum(['소속', '미소속']).default('소속'),
  affiliation: z.string().max(100, '소속은 100자 이하여야 합니다'),
  role: z.string().max(100, '역할은 100자 이하여야 합니다'),
  work_field: z.string().max(100, '하는일은 100자 이하여야 합니다'),
  contact: z.string().max(100, '연락처는 100자 이하여야 합니다'),
  mbti: z.string().optional(),
  personality_keywords: z.array(z.string()).max(3, '성격 키워드는 최대 3개까지 선택할 수 있습니다'),
  interest_keywords: z.array(z.string()).max(3, '관심 키워드는 최대 3개까지 선택할 수 있습니다'),
  hobby_keywords: z.array(z.string()).max(3, '취미는 최대 3개까지 선택할 수 있습니다'),
  introduction: z.string().max(500, '자기소개는 500자 이하여야 합니다'),
  external_link: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal(''))
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function CreateNamecardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // SimpleUserLayout에서 이미 명함 체크를 했으므로 여기 도달했다면 명함 생성이 필요한 상태
  // useUserProfile 훅 사용하지 않음 (중복 쿼리 방지)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      birth_date: '',
      affiliation_type: '소속',
      affiliation: '',
      role: '',
      work_field: '',
      contact: '',
      mbti: '',
      personality_keywords: [],
      interest_keywords: [],
      hobby_keywords: [],
      introduction: '',
      external_link: ''
    }
  })

  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ]

  const personalityOptions = [
    '낯가림이 있어요', '사람들과 잘 어울려요', '호기심이 많아요', '조용한 편이에요',
    '에너지가 많은 편이에요', '계획을 세우는 걸 좋아해요', '즉흥적으로 움직이는 편이에요',
    '리더보다 서포터가 편해요', '공감을 잘하는 편이에요', '혼자 있는 시간을 좋아해요',
    '말보다 글이 더 편해요', '꼼꼼한 편이에요', '감성적인 편이에요', '솔직하게 말하는 편이에요',
    '새로운 아이디어를 자주 떠올려요'
  ]

  const interestOptions = [
    '인공지능', '창업', '퍼스널 브랜딩', '콘텐츠 제작', '사회적기업', '젠더/다양성',
    '교환/유학', '감정표현', '전시/예술', '문학/에세이', 'SNS/커뮤니티', '교육격차',
    '진로탐색', '자기계발', '지속가능성'
  ]

  const hobbyOptions = [
    '독서', '영화감상', '음악감상', '운동', '요리', '여행', '사진', '게임',
    '등산', '자전거', '수영', '자기계발', '사람', '그림그리기', '악기연주',
    '춤', '글쓰기', '쇼핑', '카페투어', '맛집탐방', '드라마', '웹툰', '만화'
  ]

  const onSubmit = async (data: ProfileFormData) => {
    console.log('=== 명함 생성 시작 ===')
    console.log('로그인된 사용자:', user)
    console.log('사용자 ID:', user?.id)
    console.log('사용자 이메일:', user?.email)

    // 사용자가 로그인되어 있지 않은 경우 처리
    if (!user) {
      toast.error('로그인이 필요합니다.')
      router.push('/login?type=user')
      return
    }

    try {
      let profileImageUrl = null

      // 이미지가 선택된 경우 업로드
      if (selectedFile) {
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', selectedFile)

          const response = await fetch('/api/user/upload-profile-image', {
            method: 'POST',
            body: formData
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || '이미지 업로드에 실패했습니다.')
          }

          profileImageUrl = result.publicUrl
          console.log('이미지 업로드 성공:', profileImageUrl)
        } catch (error) {
          console.error('이미지 업로드 오류:', error)
          console.error('오류 상세:', JSON.stringify(error, null, 2))

          // 이미지 업로드 실패해도 명함 생성은 계속 진행
          toast.warning('이미지 업로드에 실패했지만 명함 생성은 계속됩니다.')
          profileImageUrl = null
        } finally {
          setIsUploading(false)
        }
      }
      // 빈 문자열들을 null로 변환
      const cleanedData = {
        full_name: data.full_name,
        birth_date: data.birth_date || null,
        affiliation_type: data.affiliation_type,
        affiliation: data.affiliation_type === '소속' ? (data.affiliation || null) : null,
        role: data.affiliation_type === '소속' ? (data.role || null) : null,
        work_field: data.affiliation_type === '미소속' ? (data.work_field || null) : null,
        contact: data.contact || null,
        mbti: data.mbti && data.mbti.trim() !== '' ? data.mbti : null,
        personality_keywords: data.personality_keywords.length > 0 ? data.personality_keywords : null,
        interest_keywords: data.interest_keywords.length > 0 ? data.interest_keywords : null,
        hobby_keywords: data.hobby_keywords.length > 0 ? data.hobby_keywords : null,
        introduction: data.introduction || null,
        external_link: data.external_link || null,
        email: user.email || '',
        company: data.affiliation_type === '소속' ? (data.affiliation || null) : null,
        keywords: data.personality_keywords.length > 0 ? data.personality_keywords : null,
        profile_image_url: profileImageUrl,
        nickname: data.full_name,
        qr_code_url: null,
        role_id: 1, // 클라이언트 사용자
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 프로필 업데이트 (이미 기본 프로필이 존재하므로)
      const createdProfile = await userProfileAPI.updateUserProfile(user.id, cleanedData)
      toast.success('명함이 성공적으로 생성되었습니다!')

      // 명함 생성
      if (createdProfile) {
        try {
          const supabase = createClient()
          const businessCardData = {
            user_id: user.id,
            full_name: createdProfile.full_name || '이름 없음',
            introduction: createdProfile.introduction || '안녕하세요!',
            company: createdProfile.affiliation,
            role: createdProfile.role,
            work_field: createdProfile.work_field,
            contact: createdProfile.contact,
            mbti: createdProfile.mbti,
            keywords: createdProfile.personality_keywords,
            personality_keywords: createdProfile.personality_keywords,
            interest_keywords: createdProfile.interest_keywords,
            hobby_keywords: createdProfile.hobby_keywords,
            external_link: createdProfile.external_link,
            profile_image_url: createdProfile.profile_image_url,
            is_public: true
          }

          const { data: businessCard, error } = await supabase
            .from('business_cards')
            .insert(businessCardData)
            .select()
            .single()

          if (error) {
            throw error
          }

          console.log('명함 생성 성공:', businessCard)
        } catch (cardError) {
          console.error('명함 생성 오류:', cardError)
          toast.error('일부 정보 저장에 실패했습니다.')
        }
      }

      // 명함 생성 완료 후 홈으로 이동
      router.push('/client/home')
    } catch (error) {
      console.error('프로필 생성 오류:', error)
      toast.error('명함 생성에 실패했습니다.')
    }
  }

  const handleMBTISelect = (mbti: string) => {
    const currentMBTI = watch('mbti')
    // 이미 선택된 MBTI를 다시 클릭하면 해제
    setValue('mbti', currentMBTI === mbti ? '' : mbti)
  }

  const handlePersonalityToggle = (personality: string) => {
    const currentKeywords = watch('personality_keywords')
    const newKeywords = currentKeywords.includes(personality)
      ? currentKeywords.filter(p => p !== personality)
      : currentKeywords.length < 3
        ? [...currentKeywords, personality]
        : currentKeywords
    setValue('personality_keywords', newKeywords)
  }

  const handleInterestToggle = (interest: string) => {
    const currentKeywords = watch('interest_keywords')
    const newKeywords = currentKeywords.includes(interest)
      ? currentKeywords.filter(p => p !== interest)
      : currentKeywords.length < 3
        ? [...currentKeywords, interest]
        : currentKeywords
    setValue('interest_keywords', newKeywords)
  }

  const handleHobbyToggle = (hobby: string) => {
    const currentKeywords = watch('hobby_keywords')
    const newKeywords = currentKeywords.includes(hobby)
      ? currentKeywords.filter(p => p !== hobby)
      : currentKeywords.length < 3
        ? [...currentKeywords, hobby]
        : currentKeywords
    setValue('hobby_keywords', newKeywords)
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    setSelectedFile(file)

    // 미리보기를 위한 URL 생성
    const imageUrl = URL.createObjectURL(file)
    setProfileImage(imageUrl)
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setSelectedFile(null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 ml-2">명함 만들기</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-5 py-6 pb-24 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          {/* 프로필 사진 섹션 */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center relative ">
              {profileImage ? (
                <>
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <User className="w-12 h-12 text-gray-600" />
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full cursor-pointer flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-purple-600 text-sm font-medium">
              {isUploading ? '업로드 중...' : '프로필 사진 추가(선택)'}
            </p>
          </div>

          {/* 제목과 설명 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              내 명함 만들기
            </h2>
            <p className="text-gray-600">
              나만의 디지털 명함을 만들어보세요
            </p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 *
              </label>
              <Input
                {...register('full_name')}
                placeholder="이름을 입력하세요"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <Input
                {...register('birth_date')}
                type="date"
                className={errors.birth_date ? 'border-red-500' : ''}
              />
              {errors.birth_date && (
                <p className="text-red-500 text-sm mt-1">{errors.birth_date.message}</p>
              )}
            </div>

            {/* 소속 */}
            <div>
              <div className="flex gap-2 mb-3 w-full">
                <Button
                  type="button"
                  variant={watch('affiliation_type') === '소속' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('affiliation_type', '소속')}
                  className={`flex-1 ${watch('affiliation_type') === '소속' ? 'bg-purple-600' : ''}`}
                >
                  소속
                </Button>
                <Button
                  type="button"
                  variant={watch('affiliation_type') === '미소속' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('affiliation_type', '미소속')}
                  className={`flex-1 ${watch('affiliation_type') === '미소속' ? 'bg-purple-600' : ''}`}
                >
                  미소속
                </Button>
              </div>
              {watch('affiliation_type') === '소속' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  소속
                  </label>
                <Input
                  {...register('affiliation')}
                  placeholder="예: 네이버"
                  className={errors.affiliation ? 'border-red-500' : ''}
                />
                </>
              )}
              {errors.affiliation && (
                <p className="text-red-500 text-sm mt-1">{errors.affiliation.message}</p>
              )}
            </div>

            {/* 역할 또는 하는일 */}
            {watch('affiliation_type') === '소속' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <Input
                  {...register('role')}
                  placeholder="예: 마케팅, 개발자, 디자이너"
                  className={errors.role ? 'border-red-500' : ''}
                />
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  하는일
                </label>
                <Input
                  {...register('work_field')}
                  placeholder="예: 프리랜서 디자이너, 스타트업 창업자, 유튜버"
                  className={errors.work_field ? 'border-red-500' : ''}
                />
                {errors.work_field && (
                  <p className="text-red-500 text-sm mt-1">{errors.work_field.message}</p>
                )}
              </div>
            )}

            {/* 연락처나 카카오톡 아이디 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처나 카카오톡 아이디(선택)
              </label>
              <Input
                {...register('contact')}
                placeholder="번호의 경우 숫자만 입력하세요"
                className={errors.contact ? 'border-red-500' : ''}
              />
              {errors.contact && (
                <p className="text-red-500 text-sm mt-1">{errors.contact.message}</p>
              )}
            </div>

            {/* MBTI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MBTI (선택)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {mbtiTypes.map((mbti) => (
                  <Button
                    key={mbti}
                    type="button"
                    variant={watch('mbti') === mbti ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleMBTISelect(mbti)}
                    className={watch('mbti') === mbti ? 'bg-purple-600' : 'text-xs'}
                  >
                    {mbti}
                  </Button>
                ))}
              </div>
            </div>

            {/* 성격 키워드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성격 키워드 * (최소 1개, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {personalityOptions.map((personality) => (
                  <Badge
                    key={personality}
                    variant={watch('personality_keywords').includes(personality) ? 'default' : 'outline'}
                    className={`cursor-pointer h-[30px] ${watch('personality_keywords').includes(personality) ? 'bg-purple-600' : ''}`}
                    onClick={() => handlePersonalityToggle(personality)}
                  >
                    {personality}
                  </Badge>
                ))}
              </div>
              {errors.personality_keywords && (
                <p className="text-red-500 text-sm mt-1">{errors.personality_keywords.message}</p>
              )}
            </div>

            {/* 관심 키워드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관심 키워드 (선택, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <Badge
                    key={interest}
                    variant={watch('interest_keywords').includes(interest) ? 'default' : 'outline'}
                    className={`cursor-pointer h-[30px] ${watch('interest_keywords').includes(interest) ? 'bg-purple-600' : ''}`}
                    onClick={() => handleInterestToggle(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              {errors.interest_keywords && (
                <p className="text-red-500 text-sm mt-1">{errors.interest_keywords.message}</p>
              )}
            </div>

            {/* 취미 키워드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                취미 (선택, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {hobbyOptions.map((hobby) => (
                  <Badge
                    key={hobby}
                    variant={watch('hobby_keywords').includes(hobby) ? 'default' : 'outline'}
                    className={`cursor-pointer h-[30px] ${watch('hobby_keywords').includes(hobby) ? 'bg-purple-600' : ''}`}
                    onClick={() => handleHobbyToggle(hobby)}
                  >
                    {hobby}
                  </Badge>
                ))}
              </div>
              {errors.hobby_keywords && (
                <p className="text-red-500 text-sm mt-1">{errors.hobby_keywords.message}</p>
              )}
            </div>

            {/* 자기소개 한줄 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자기소개 한줄 (선택)
              </label>
              <textarea
                {...register('introduction')}
                rows={3}
                placeholder="자기소개를 입력하세요"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.introduction ? 'border-red-500' : ''
                }`}
              />
              {errors.introduction && (
                <p className="text-red-500 text-sm mt-1">{errors.introduction.message}</p>
              )}
            </div>

            {/* 대표 외부 링크 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대표 외부 링크 (선택)
              </label>
              <Input
                {...register('external_link')}
                placeholder="https://example.com"
                className={errors.external_link ? 'border-red-500' : ''}
              />
              {errors.external_link && (
                <p className="text-red-500 text-sm mt-1">{errors.external_link.message}</p>
              )}
            </div>

          </form>
        </motion.div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 max-w-md mx-auto">
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
        >
          {isSubmitting ? '생성 중...' : '명함 생성하기'}
        </Button>
      </div>
    </div>
  )
}
