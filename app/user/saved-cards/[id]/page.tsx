"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessCards } from '@/hooks/use-business-cards'
import { collectedCardAPI } from '@/lib/supabase/database'
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Star } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CollectedCard {
  id: string
  is_favorite: boolean
  memo?: string
  business_cards: {
    full_name?: string
    role?: string
    company?: string
    share_link?: string
    introduction?: string
    email?: string
    contact?: string
    age?: string
    mbti?: string
  }
}

export default function SavedCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { collectedCards, toggleFavorite, removeCollectedCard } = useBusinessCards()
  const [collection, setCollection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (!params.id) return

    const foundCollection = collectedCards.find(c => c.id === params.id)
    if (foundCollection) {
      setCollection(foundCollection)
      setMemo(foundCollection.memo || '')
    }
    setLoading(false)
  }, [params.id, collectedCards])

  const handleToggleFavorite = async () => {
    if (!collection) return

    try {
      const success = await collectedCardAPI.toggleFavorite(collection.id, !collection.is_favorite)
      if (success) {
        setCollection((prev: any) => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
        toast.success(collection.is_favorite ? '즐겨찾기에서 제거했습니다' : '즐겨찾기에 추가했습니다')
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
      toast.error('즐겨찾기 변경에 실패했습니다')
    }
  }

  const handleSaveMemo = async () => {
    if (!collection) return

    try {
      const success = await collectedCardAPI.updateMemo(collection.id, memo)
      if (success) {
        toast.success('메모가 저장되었습니다')
      }
    } catch (error) {
      console.error('메모 저장 오류:', error)
      toast.error('메모 저장에 실패했습니다')
    }
  }

  const handleRemoveCard = async () => {
    if (!collection) return

    try {
      await removeCollectedCard(collection.id)
      toast.success('명함을 삭제했습니다')
      router.push('/saved-cards')
    } catch (error) {
      console.error('명함 삭제 오류:', error)
      toast.error('명함 삭제에 실패했습니다')
    }
  }

  const handleShare = () => {
    if (!collection?.business_cards?.share_link) {
      toast.error('공유 링크가 없습니다')
      return
    }

    // 공유 링크 복사
    navigator.clipboard.writeText(collection.business_cards.share_link)
    toast.success('공유 링크가 복사되었습니다')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">명함 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!collection || !collection.business_cards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">명함을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청하신 명함이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/saved-cards">
            <Button>명함 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const card = collection.business_cards

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">명함 상세</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 명함 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {card.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{card.full_name || '이름 없음'}</h2>
                  <p className="text-gray-600 text-lg mb-1">
                    {card.introduction || '소개가 없습니다'}
                  </p>
                  <p className="text-gray-600">
                    {card.age && `${card.age}세 • `}{card.company || '회사 없음'} / {card.role || '직책 없음'}
                  </p>
                  {card.mbti && (
                    <p className="text-gray-600">MBTI: {card.mbti}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={collection.is_favorite ? "text-yellow-500" : "text-gray-400"}
              >
                <Star className={`w-6 h-6 ${collection.is_favorite ? "fill-current" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 성격 */}
            {card.keywords && card.keywords.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">성격</h3>
                <div className="flex flex-wrap gap-2">
                  {card.keywords.slice(0, 3).map((keyword: string, index: number) => (
                    <Badge key={index} className="bg-purple-100 text-purple-700 border-purple-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 관심사 */}
            {card.keywords && card.keywords.length > 3 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">관심사</h3>
                <div className="flex flex-wrap gap-2">
                  {card.keywords.slice(3).map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 연락처 */}
            <div className="space-y-3">
              {card.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">이메일</p>
                    <p className="font-medium">{card.email}</p>
                  </div>
                </div>
              )}

              {card.contact && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">연락처</p>
                    <p className="font-medium">{card.contact}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 외부 링크 */}
            {card.external_link && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">링크</h3>
                <div className="space-y-2">
                  <Card className="bg-gray-50">
                    <CardContent className="p-3">
                      <p className="font-medium">Medium</p>
                      <p className="text-sm text-gray-600">medium.com</p>
                    </CardContent>
                  </Card>
                  <a
                    href={card.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    {card.external_link}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">메모</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="이 사람에 대한 메모를 작성해보세요..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleSaveMemo} className="w-full">
              메모 저장
            </Button>
          </CardContent>
        </Card>

        {/* 수집 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">수집 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">수집일</p>
                <p className="font-medium">
                  {new Date(collection.collected_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {collection.event_id && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">수집 이벤트</p>
                  <p className="font-medium">이벤트 ID: {collection.event_id}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 명함 수집하기 버튼 */}
        <Button className="w-full bg-purple-600 hover:bg-purple-700">
          명함 수집하기
        </Button>
      </div>
    </div>
  )
}
