// @ts-nocheck
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessCards } from '@/hooks/use-business-cards'
import { useUserProfile } from '@/hooks/use-user-profile'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, User, X, Plus, Minus, Link as LinkedIcon Youtube, Instagram, Linkedin, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// 외부 링크 타입 정의
type ExternalLinkType = 'none' | 'youtube' | 'instagram' | 'linkedin' | 'custom'

// Zod 스키마 정의 - external_link를 문자열로 유지
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
  hobby_keywords: z.array(z.string()).max(3, '취미는 최대 3개까지 입력할 수 있습니다'),
  introduction: z.string().max(500, '자기소개는 500자 이하여야 합니다'),
  external_: z.string().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function EditNamecardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, updateProfile, createProfile, loading } = useUserProfile()
  const { userCard, createBusinessCard, updateBusinessCard } = useBusinessCards()

  // 프로필 이미지 업로드 관련 상태
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 주관식 취미 입력 필드 상태
  const [hobbyInputs, setHobbyInputs] = useState<string[]>([''])

  // 외부 링크 관련 상태
  const [selectedType, setSelectedType] = useState<ExternalType>('none')
  const [Value, setValue] = useState('')
  const [custom, setCustom] = useState('')

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
      external_: ''
    }
  })

  // 외부 링크 타입 변경 시 처리
  useEffect(() => {
    if (selectedType === 'none') {
      setValue('external_', '')
      setValue('')
      setCustom('')
    } else if (selectedType === 'custom') {
      setValue('external_', custom)
    } else {
      // 플랫폼별 링크 생성
      updatePlatform(selectedType, Value)
    }
  }, [selectedType, Value, custom, setValue])

  const updatePlatform = (type: ExternalType, value: string) => {
    if (!value.trim()) {
      setValue('external_', '')
      return
    }

    let fullUrl = ''
    switch (type) {
      case 'youtube':
        fullUrl = `https://www.youtube.com/${value}`
        break
      case 'instagram':
        fullUrl = `https://www.instagram.com/${value}`
        break
      case 'edin':
        // edIn은 다양한 형식이 있을 수 있으므로 @가 포함된 경우와 아닌 경우 처리
        if (value.startsWith('@')) {
          fullUrl = `https://www.edin.com/in/${value.substring(1)}`
        } else if (value.startsWith('in/')) {
          fullUrl = `https://www.edin.com/${value}`
        } else {
          fullUrl = `https://www.edin.com/in/${value}`
        }
        break
      default:
        fullUrl = value
    }
    setValue('external_', fullUrl)
  }

  // 기존 데이터 로드 (명함 데이터 우선, 없으면 프로필 데이터 사용)
  useEffect(() => {
    if (profile || userCard) {
      // 명함 데이터가 있으면 우선 사용, 없으면 프로필 데이터 사용
      const dataSource = userCard || profile

      setValue('full_name', dataSource?.full_name || '')
      setValue('birth_date', profile?.birth_date || '') // 생년월일은 프로필에서만
      setValue('affiliation_type', (profile?.affiliation_type as '소속' | '미소속') || '소속')
      setValue('affiliation', dataSource?.affiliation || dataSource?.company || '')
      setValue('role', dataSource?.job_title || '') // 명함의 job_title 우선 사용
      setValue('work_field', dataSource?.work_field || '')
      setValue('contact', dataSource?.contact || '')
      setValue('mbti', dataSource?.mbti || '')
      // 기존 keywords를 personality_keywords로 마이그레이션
      setValue('personality_keywords', dataSource?.personality_keywords || dataSource?.keywords || [])
      setValue('interest_keywords', dataSource?.interest_keywords || [])
      
      // 취미 데이터 초기화
      const existingHobbies = dataSource?.hobby_keywords || []
      setValue('hobby_keywords', existingHobbies)
      
      // 취미 입력 필드 초기화
      if (existingHobbies.length > 0) {
        setHobbyInputs([...existingHobbies, ...Array(3 - existingHobbies.length).fill('')].slice(0, 3))
      } else {
        setHobbyInputs([''])
      }
      
      setValue('introduction', dataSource?.introduction || '')
      
      // external_ 설정 (Profile은 external_s 배열, BusinessCard는 external_ 단일 값)
      let externalValue = ''
      if (userCard?.external_) {
        // 명함 데이터: external_ 단일 값
        externalValue = userCard.external_
      } else if (profile?.external_s && profile.external_links.length > 0) {
        // 프로필 데이터: external_links 배열의 첫 번째 값
        externalLinkValue = profile.external_links[0]
      }
      setValue('external_link', externalLinkValue)

      // 외부 링크 타입과 값 파싱
      parseExistingLink(externalLinkValue)

      // 프로필 이미지 초기화
      setProfileImage(dataSource?.profile_image_url || null)
    }
  }, [profile, userCard, setValue])

  // 기존 링크를 플랫폼 타입과 값으로 파싱하는 함수
  const parseExistingLink = (link: string) => {
    if (!link) {
      setSelectedLinkType('none')
      setLinkValue('')
      setCustomLink('')
      return
    }

    // YouTube URL 파싱
    if (link.includes('youtube.com/')) {
      setSelectedLinkType('youtube')
      const youtubeMatch = link.match(/youtube\.com\/(@.+|\/c\/.+|channel\/.+|.+)/)
      if (youtubeMatch) {
        const username = youtubeMatch[1]
        // @, /c/, channel/ 접두사 제거하고 순수 사용자명/채널명만 저장
        const cleanUsername = username.replace(/^(@|\/c\/|channel\/)/, '')
        setLinkValue(cleanUsername)
      } else {
        setLinkValue('')
      }
    }
    // Instagram URL 파싱
    else if (link.includes('instagram.com/')) {
      setSelectedLinkType('instagram')
      const instagramMatch = link.match(/instagram\.com\/([^/?]+)/)
      if (instagramMatch) {
        setLinkValue(instagramMatch[1])
      } else {
        setLinkValue('')
      }
    }
    // LinkedIn URL 파싱
    else if (link.includes('linkedin.com/')) {
      setSelectedLinkType('linkedin')
      const linkedinMatch = link.match(/linkedin\.com\/(in\/|)([^/?]+)/)
      if (linkedinMatch) {
        const username = linkedinMatch[2]
        setLinkValue(username)
      } else {
        setLinkValue('')
      }
    }
    // 기타 URL (직접 입력)
    else {
      setSelectedLinkType('custom')
      setCustomLink(link)
    }
  }

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setProfileImage(null)
    setSelectedFile(null)
  }

  // 주관식 취미 입력 필드 관리
  const addHobbyInput = () => {
    if (hobbyInputs.length < 3) {
      setHobbyInputs([...hobbyInputs, ''])
    }
  }

  const removeHobbyInput = (index: number) => {
    if (hobbyInputs.length > 1) {
      const newHobbyInputs = hobbyInputs.filter((_, i) => i !== index)
      setHobbyInputs(newHobbyInputs)
      
      // 폼 데이터도 업데이트
      const currentHobbies = watch('hobby_keywords')
      const newHobbies = currentHobbies.filter((_, i) => i !== index)
      setValue('hobby_keywords', newHobbies)
    }
  }

  const updateHobby = (index: number, value: string) => {
    const newHobbies = [...watch('hobby_keywords')]
    newHobbies[index] = value
    setValue('hobby_keywords', newHobbies)
  }

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

  const onSubmit = async (data: ProfileFormData) => {
    try {
      console.log('📝 폼 제출 데이터:', data) // 디버깅 로그 추가

      let profileImageUrl = profileImage

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

          // 이미지 업로드 실패해도 명함 수정은 계속 진행
          toast.warning('이미지 업로드에 실패했지만 명함 수정은 계속됩니다.')
          profileImageUrl = profileImage // 기존 이미지 URL 유지
        } finally {
          setIsUploading(false)
        }
      }

      // Profile용 데이터 (external_links 배열)
      const profileData = {
        full_name: data.full_name,
        birth_date: data.birth_date || null,
        affiliation_type: data.affiliation_type,
        affiliation: data.affiliation_type === '소속' ? (data.affiliation || null) : null,
        job_title: data.affiliation_type === '소속' ? (data.role || null) : null,
        work_field: data.affiliation_type === '미소속' ? (data.work_field || null) : null,
        contact: data.contact || null,
        mbti: data.mbti && data.mbti.trim() !== '' ? data.mbti : null,
        personality_keywords: data.personality_keywords.length > 0 ? data.personality_keywords : null,
        interest_keywords: data.interest_keywords.length > 0 ? data.interest_keywords : null,
        hobby_keywords: data.hobby_keywords.filter(hobby => hobby.trim() !== ''), // 빈 문자열 제거
        introduction: data.introduction || null,
        external_links: data.external_link ? [data.external_link] : [], // 배열로 저장
        email: user?.email || '',
        company: data.affiliation_type === '소속' ? (data.affiliation || null) : null,
        keywords: data.personality_keywords.length > 0 ? data.personality_keywords : null,
        profile_image_url: profileImageUrl,
        nickname: data.full_name,
        qr_code_url: null,
        role: 'user', // 시스템 역할
        role_id: 1, // 기본 사용자 역할
        has_business_card: true, // 명함 보유 여부
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let updatedProfile

      // 프로필이 없으면 생성, 있으면 업데이트
      if (!profile) {
        updatedProfile = await createProfile(profileData)
        toast.success('명함이 성공적으로 생성되었습니다!')
      } else {
        updatedProfile = await updateProfile(profileData)
        toast.success('명함이 성공적으로 수정되었습니다!')
      }

      // BusinessCard용 데이터 (external_link 단일 값)
      const businessCardData = {
        full_name: updatedProfile.full_name || '이름 없음',
        introduction: updatedProfile.introduction || '안녕하세요!',
        company: updatedProfile.affiliation,
        job_title: updatedProfile.job_title,
        work_field: updatedProfile.work_field,
        contact: updatedProfile.contact,
        mbti: updatedProfile.mbti,
        keywords: updatedProfile.personality_keywords,
        personality_keywords: updatedProfile.personality_keywords,
        interest_keywords: updatedProfile.interest_keywords,
        hobby_keywords: updatedProfile.hobby_keywords,
        external_link: data.external_link || null, // 단일 값으로 저장
        profile_image_url: updatedProfile.profile_image_url,
        is_public: true
      }

      // 명함이 없으면 프로필 정보로 명함 생성
      if (!userCard && updatedProfile) {
        try {
          await createBusinessCard(businessCardData)
        } catch (cardError) {
          console.error('명함 생성 오류:', cardError)
          toast.error('일부 정보 저장에 실패했습니다.')
        }
      } else if (userCard && updatedProfile) {
        // 기존 명함이 있으면 업데이트
        try {
          const businessCardUpdates: any = {
            full_name: updatedProfile.full_name || null,
            introduction: updatedProfile.introduction || null,
            company: updatedProfile.affiliation || null,
            job_title: updatedProfile.job_title || null,
            work_field: updatedProfile.work_field || null,
            contact: updatedProfile.contact || null,
            mbti: updatedProfile.mbti && updatedProfile.mbti.trim() !== '' ? updatedProfile.mbti : null,
            keywords: updatedProfile.personality_keywords || null,
            interest_keywords: updatedProfile.interest_keywords || null,
            hobby_keywords: updatedProfile.hobby_keywords || null,
            external_link: data.external_link || null, // 단일 값으로 업데이트
            profile_image_url: updatedProfile.profile_image_url || null
          }

          // 서버 API를 통해 명함 업데이트
          const response = await fetch('/api/auth/update-business-card', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cardId: userCard.id,
              updates: businessCardUpdates
            })
          })

          if (!response.ok) {
            throw new Error('명함 업데이트 API 호출 실패')
          }

          const result = await response.json()
          console.log('명함 업데이트 성공:', result)
        } catch (cardError) {
          console.error('명함 업데이트 오류:', cardError)
          toast.error('일부 정보 업데이트에 실패했습니다.')
        }
      }

      router.push('/client/home')
    } catch (error) {
      console.error('프로필 처리 오류:', error)
      toast.error('프로필 처리에 실패했습니다.')
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

  // 플랫폼 아이콘 컴포넌트
  const PlatformIcon = ({ type }: { type: ExternalLinkType }) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />
      case 'custom':
        return <Globe className="w-4 h-4" />
      default:
        return <LinkedIcon className="w-4 h-4" />
    }
  }

  // 플랫폼 예시 텍스트
  const getPlatformPlaceholder = (type: ExternalLinkType) => {
    switch (type) {
      case 'youtube':
        return '예: @username 또는 채널명'
      case 'instagram':
        return '예: username'
      case 'linkedin':
        return '예: username 또는 in/username'
      case 'custom':
        return '예: https://example.com'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/my-namecard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">내 명함 수정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6">
        {loading ? (
          // 로딩 스켈레톤
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
            </div>

            <div className="text-center mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
            </div>

            <div className="space-y-6">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            {/* 프로필 사진 섹션 */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center relative">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="프로필 이미지"
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
                <label
                  htmlFor="profile-image-input"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 text-white" />
                </label>
              </div>
              <p className="text-purple-600 text-sm font-medium">
                {isUploading ? '업로드 중...' : '프로필 사진 추가(선택)'}
              </p>
              <input
                id="profile-image-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {/* 제목과 설명 */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile ? '내 명함 수정' : '내 명함 만들기'}
              </h2>
              <p className="text-gray-600">
                {profile ? '명함 정보를 수정하세요' : '나만의 디지털 명함을 만들어보세요'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소속
                </label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={watch('affiliation_type') === '소속' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('affiliation_type', '소속')}
                    className={watch('affiliation_type') === '소속' ? 'bg-purple-600' : ''}
                  >
                    소속
                  </Button>
                  <Button
                    type="button"
                    variant={watch('affiliation_type') === '미소속' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('affiliation_type', '미소속')}
                    className={watch('affiliation_type') === '미소속' ? 'bg-purple-600' : ''}
                  >
                    미소속
                  </Button>
                </div>
                {watch('affiliation_type') === '소속' && (
                  <Input
                    {...register('affiliation')}
                    placeholder="예: 네이버"
                    className={errors.affiliation ? 'border-red-500' : ''}
                  />
                )}
                {errors.affiliation && (
                  <p className="text-red500 text-sm mt-1">{errors.affiliation.message}</p>
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
                      className={`cursor-pointer ${watch('personality_keywords').includes(personality) ? 'bg-purple-600' : ''}`}
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
                      className={`cursor-pointer ${watch('interest_keywords').includes(interest) ? 'bg-purple-600' : ''}`}
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

              {/* 취미 키워드 - 주관식 입력으로 변경 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  취미 (선택, 최대 3개)
                </label>
                <div className="space-y-3">
                  {hobbyInputs.map((_, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder={`취미 ${index + 1}을 입력하세요`}
                        value={watch('hobby_keywords')[index] || ''}
                        onChange={(e) => updateHobby(index, e.target.value)}
                        className="flex-1"
                      />
                      {hobbyInputs.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeHobbyInput(index)}
                          className="shrink-0 h-10 w-10 border-red-300 text-red-500 hover:bg-red-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {hobbyInputs.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addHobbyInput}
                      className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      취미 추가하기
                    </Button>
                  )}
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

              {/* 대표 외부 링크 - 개선된 버전 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대표 외부 링크 (선택)
                </label>
                
                {/* 플랫폼 선택 */}
                <div className="mb-3">
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setSelectedType(value as ExternalType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="플랫폼 선택">
                        <div className="flex items-center gap-2">
                          <PlatformIcon type={selectedType} />
                          {selectedType === 'none' ? '플랫폼 선택' : 
                           selectedType === 'youtube' ? 'YouTube' :
                           selectedType === 'instagram' ? 'Instagram' :
                           selectedLinkType === 'linkedin' ? 'LinkedIn' :
                           '직접 입력'}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <LinkedIcon className="w-4 h-4" />
                          없음
                        </div>
                      </SelectItem>
                      <SelectItem value="youtube">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          YouTube
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          Instagram
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-blue-700" />
                          LinkedIn
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          직접 입력
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 입력 필드 */}
                {selectedLinkType !== 'none' && (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <PlatformIcon type={selectedLinkType} />
                    </div>
                    
                    {selectedLinkType === 'custom' ? (
                      <Input
                        placeholder={getPlatformPlaceholder(selectedLinkType)}
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        className={`pl-10 ${errors.external_link ? 'border-red-500' : ''}`}
                      />
                    ) : (
                      <>
                        <Input
                          placeholder={getPlatformPlaceholder(selectedLinkType)}
                          value={linkValue}
                          onChange={(e) => setLinkValue(e.target.value)}
                          className={`pl-10 ${errors.external_link ? 'border-red-500' : ''}`}
                        />
                        {linkValue && (
                          <div className="mt-1 text-xs text-gray-500">
                            생성된 링크: {watch('external_link')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {errors.external_link && (
                  <p className="text-red-500 text-sm mt-1">{errors.external_link.message}</p>
                )}
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
              >
                {isSubmitting ? '저장 중...' : (profile ? '명함 수정 완료' : '명함 생성하기')}
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}
