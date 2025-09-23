"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Globe, Mail, Phone, Share, Star, Trash2 } from 'lucide-react'
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
    const name = businessCard?.name || 'U'
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
    const shareText = `${businessCard.name} - ${businessCard.title} / ${businessCard.company}`

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
    <div className="min-h-screen ">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/client/saved-cards">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">명함 상세</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="p-2"
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2"
            >
              <Share className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* 명함 카드 */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden mb-6">
          <CardContent className="p-0">
            {/* 헤더 배경 */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 h-24 relative">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="w-16 h-16 bg-white rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-xl">{getInitial()}</span>
                </div>
              </div>
            </div>

            {/* 명함 정보 */}
            <div className="pt-10 pb-6 px-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {businessCard.name}
              </h2>
              <p className="text-purple-600 font-medium mb-1">
                {businessCard.title}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {businessCard.company}
              </p>

              {/* 소개 */}
              {businessCard.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {businessCard.bio}
                  </p>
                </div>
              )}

              {/* 연락처 정보 */}
              <div className="space-y-3 mb-6">
                {/* 이메일 */}
                <div className="flex items-center justify-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a
                    href={`mailto:${businessCard.email}`}
                    className="text-gray-700 hover:text-purple-600"
                  >
                    {businessCard.email}
                  </a>
                </div>

                {/* 전화번호 */}
                {businessCard.phone && (
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <a
                      href={`tel:${businessCard.phone}`}
                      className="text-gray-700 hover:text-purple-600"
                    >
                      {businessCard.phone}
                    </a>
                  </div>
                )}

                {/* 웹사이트 */}
                {businessCard.website && (
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <a
                      href={businessCard.website.startsWith('http') ? businessCard.website : `https://${businessCard.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-purple-600"
                    >
                      {businessCard.website}
                    </a>
                  </div>
                )}
              </div>

              {/* 저장 정보 */}
              <div className="text-center mb-6">
                <p className="text-gray-500 text-xs">
                  저장일: {new Date(savedCard.collected_at || savedCard.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`mailto:${businessCard.email}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    이메일
                  </Button>
                  {businessCard.phone && (
                    <Button
                      onClick={() => window.open(`tel:${businessCard.phone}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      전화
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? '삭제 중...' : '명함 삭제'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
