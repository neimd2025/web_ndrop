'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { ROLE_IDS } from '@/lib/constants'
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

// Zod 스키마 정의 - external_links를 배열로 수정
const profileSchema = z.object({
  full_name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  birth_date: z.string().optional(),
  affiliation_type: z.enum(['소속', '미소속']).default('소속'),
  affiliation: z.string().max(100, '소속은 100자 이하여야 합니다'),
  role: z.string().max(100, '역할은 100자 이하여야 합니다'),
  work_field: z.string().max(100, '하는일은 100자 이하여야 합니다'),
  contact: z.string().max(100, '연락처는 100자 이하여야 합니다'),
  mbti: z.string().optional(),
  personality_keywords: z.array(z.string()).min(1, '성격 키워드는 최소 1개 이상 선택해주세요').max(3, '성격 키워드는 최대 3개까지 선택할 수 있습니다'),
  interest_keywords: z.array(z.string()).max(3, '관심 키워드는 최대 3개까지 선택할 수 있습니다'),
  hobby_keywords: z.array(z.string()).max(3, '취미는 최대 3개까지 선택할 수 있습니다'),
  introduction: z.string().max(500, '자기소개는 500자 이하여야 합니다'),
  external_link: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')) // 단일 링크 입력용
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function CreateNamecardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
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

  if (!user) {
    toast.error('로그인이 필요합니다.')
    router.push('/login?type=user')
    return
  }

  if (isSubmitting) {
    console.log('이미 제출 중입니다.')
    return
  }

  setIsSubmitting(true)

  try {
    const supabase = createClient()
    console.log('=== Supabase 클라이언트 생성 완료 ===')

    // 1. 가장 기본적인 데이터만 준비
    const basicData = {
      id: user.id,
      full_name: data.full_name,
      email: user.email,
      role_id: ROLE_IDS.USER,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('=== 기본 데이터 준비 완료 ===', basicData)

    // 2. 먼저 upsert만 시도 (select 제외)
    console.log('=== 프로필 upsert 시작 ===')
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(basicData)

    console.log('=== 프로필 upsert 완료 ===', { upsertError })

    if (upsertError) {
      console.error('프로필 upsert 실패:', upsertError)
      throw upsertError
    }

    // 3. 성공하면 select로 데이터 가져오기
    console.log('=== 프로필 select 시작 ===')
    const { data: createdProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('=== 프로필 select 완료 ===', { createdProfile, selectError })

    if (selectError) {
      console.error('프로필 select 실패:', selectError)
      throw selectError
    }

    console.log('=== 프로필 저장 성공 ===', createdProfile)

    // 4. 명함 생성도 마찬가지로 분리
    console.log('=== 명함 생성 시작 ===')
    const businessCardData = {
      user_id: user.id,
      full_name: data.full_name,
      introduction: data.introduction || '안녕하세요!',
      company: data.affiliation_type === '소속' ? data.affiliation : null,
      job_title: data.affiliation_type === '소속' ? data.role : null,
      work_field: data.affiliation_type === '미소속' ? data.work_field : null,
      contact: data.contact || null,
      mbti: data.mbti || null,
      personality_keywords: data.personality_keywords,
      interest_keywords: data.interest_keywords,
      hobby_keywords: data.hobby_keywords,
      external_link: data.external_link || null,
      is_public: true
    }

    console.log('=== 명함 데이터:', businessCardData)

    const { error: cardError } = await supabase
      .from('business_cards')
      .upsert(businessCardData)

    console.log('=== 명함 upsert 완료 ===', { cardError })

    if (cardError) {
      console.error('명함 생성 실패:', cardError)
      throw cardError
    }

    toast.success('명함이 성공적으로 생성되었습니다!')
    console.log('=== 명함 생성 완료, 홈으로 이동 ===')

    // 홈으로 이동
    router.push('/client/home')

  } catch (error) {
    console.error('명함 생성 전체 오류:', error)
    console.error('오류 상세:', JSON.stringify(error, null, 2))
    toast.error(`명함 생성에 실패했습니다: ${error.message}`)
  } finally {
    setIsSubmitting(false)
  }
}

  const handleMBTISelect = (mbti: string) => {
    const currentMBTI = watch('mbti')
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    setSelectedFile(file)
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
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center relative">
              {profileImage ? (
                <>
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="w-full h-full object-cover rounded-full"
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