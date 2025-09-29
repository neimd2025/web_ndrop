"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserSavedCardDetailClientProps {
  user: UserProfile
  savedCard: any
}

export function UserSavedCardDetailClient({ user, savedCard }: UserSavedCardDetailClientProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(savedCard.is_favorite || false)
  const [isDeleting, setIsDeleting] = useState(false)
  const businessCard = savedCard.business_card

  const getInitial = () => {
    const name = businessCard?.full_name || businessCard?.name || 'U'
    return name.charAt(0).toUpperCase()
  }

  const handleToggleFavorite = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('collected_cards')
        .update({ is_favorite: !isFavorite })
        .eq('id', savedCard.id)

      if (error) {
        console.error('즐겨찾기 업데이트 오류:', error)
        alert('즐겨찾기 상태 변경에 실패했습니다.')
        return
      }

      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 명함을 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('collected_cards')
        .delete()
        .eq('id', savedCard.id)

      if (error) {
        console.error('명함 삭제 오류:', error)
        alert('명함 삭제에 실패했습니다.')
        return
      }

      alert('명함이 삭제되었습니다.')
      router.push('/client/saved-cards')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShare = async () => {
    const shareText = `${businessCard.full_name || businessCard.name} - ${businessCard.job_title || businessCard.title} / ${businessCard.company}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: '명함 공유',
          text: shareText,
          url: window.location.href
        })
      } catch (error) {
        console.error('공유 실패:', error)
        fallbackShare(shareText)
      }
    } else {
      fallbackShare(shareText)
    }
  }

  const fallbackShare = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => alert('명함 정보가 클립보드에 복사되었습니다!'))
        .catch(() => alert('복사에 실패했습니다.'))
    }
  }

  if (!businessCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">명함 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/client/saved-cards">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-center">명함 상세</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          {/* 명함 카드 */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-xl p-6 mb-6">
            {/* 프로필 섹션 */}
            <div className="text-center mb-6">
              {/* 프로필 이미지 */}
              <div className="w-24 h-24 bg-purple-500 rounded-full mx-auto mb-5 flex items-center justify-center">
                {businessCard?.profile_image_url ? (
                  <img
                    src={businessCard.profile_image_url}
                    alt={businessCard.full_name || businessCard.name || '사용자'}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              {/* 이름과 소개 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {businessCard.full_name || businessCard.name || '이름 없음'}
              </h2>
              <p className="text-gray-600 text-base mb-4">
                {businessCard.introduction || businessCard.bio || '하루하루 의미있게'}
              </p>

              {/* 기본 정보 */}
              <div className="space-y-1 text-sm text-gray-500">
                {businessCard.mbti && <p>MBTI: {businessCard.mbti}</p>}
                {(businessCard.job_title || businessCard.title) && <p>{businessCard.job_title || businessCard.title}</p>}
                {(businessCard.company || businessCard.affiliation) && <p>{businessCard.company || businessCard.affiliation}</p>}
                {(businessCard.phone || businessCard.contact) && <p>연락처: {businessCard.phone || businessCard.contact}</p>}
              </div>
            </div>

            {/* 성격 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">성격</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {(businessCard.personality_keywords && businessCard.personality_keywords.length > 0) ? (
                  businessCard.personality_keywords.slice(0, 3).map((keyword: string, index: number) => (
                    <span key={index} className="bg-[#7C3BED] text-white border-purple-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (businessCard.keywords && businessCard.keywords.length > 0) ? (
                  businessCard.keywords.slice(0, 3).map((keyword: string, index: number) => (
                    <span key={index} className="bg-[#7C3BED] text-white border-purple-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 관심사 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">관심사</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {(businessCard.interest_keywords && businessCard.interest_keywords.length > 0) ? (
                  businessCard.interest_keywords.slice(0, 3).map((keyword: string, index: number) => (
                    <span key={index} className="bg-white text-gray-800 border-gray-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 취미 섹션 */}
            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-3">취미</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {(businessCard.hobby_keywords && businessCard.hobby_keywords.length > 0) ? (
                  businessCard.hobby_keywords.slice(0, 4).map((keyword: string, index: number) => (
                    <span key={index} className="bg-white text-gray-800 border-gray-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>

            {/* 외부 링크 섹션 */}
            <div className="mb-6">
              <h3 className="text-left text-lg font-semibold text-gray-900 mb-3">외부링크</h3>
              <div className="border border-gray-200 rounded-xl p-4">
                {(businessCard.external_link || businessCard.website) ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      - {businessCard.external_link ? '외부 링크' : '웹사이트'}
                    </h4>
                    <p className="text-gray-600 text-sm mb-2">
                      {businessCard.external_link || businessCard.website}
                    </p>
                    <a
                      href={(businessCard.external_link || businessCard.website).startsWith('http') ? (businessCard.external_link || businessCard.website) : `https://${businessCard.external_link || businessCard.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 text-sm hover:underline"
                    >
                      링크 열기
                    </a>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">정보 없음</div>
                )}
              </div>
            </div>
          </Card>

          {/* 액션 버튼들 */}
          <div className="space-y-3 flex flex-col gap-1">
            {businessCard.email && (
              <Button
                onClick={() => window.open(`mailto:${businessCard.email}`, '_blank')}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                이메일 보내기
              </Button>
            )}

            {businessCard.phone && (
              <Button
                onClick={() => window.open(`tel:${businessCard.phone}`, '_blank')}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                전화 걸기
              </Button>
            )}

            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? '삭제 중...' : '명함 삭제'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
