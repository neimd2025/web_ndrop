"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { collectedCardAPI } from '@/lib/supabase/database'
import { Edit, Search, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function SavedCardsPage() {
  const { user } = useAuth()
  const [collectedCards, setCollectedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const router = useRouter()

  // 즐겨찾기된 명함 필터링
  const favoriteCards = collectedCards.filter(card => card.is_favorite)

  const loadCollectedCards = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const cardsData = await collectedCardAPI.getUserCollectedCards(user.id)
      setCollectedCards(cardsData)
    } catch (error) {
      console.error('Error loading collected cards:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadCollectedCards()
  }, [loadCollectedCards])

  const handleToggleFavorite = async (collectionId: string, isFavorite: boolean) => {
    try {
      const success = await collectedCardAPI.toggleFavorite(collectionId, isFavorite)
      if (success) {
        setCollectedCards(prev =>
          prev.map(card =>
            card.id === collectionId
              ? { ...card, is_favorite: isFavorite }
              : card
          )
        )
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // 필터링된 명함 목록
  const filteredCards = collectedCards.filter(card => {
    const matchesSearch = !searchTerm ||
      card.business_cards?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.business_cards?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.business_cards?.role?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFavorite = !showFavorites || card.is_favorite

    return matchesSearch && matchesFavorite
  })



  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">명함을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">명함을 수집하려면 먼저 로그인해주세요.</p>
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">수집된 명함</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="이름, 회사, 직책으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(false)}
              className={!showFavorites ? "bg-purple-600" : ""}
            >
              전체
            </Button>
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(true)}
              className={showFavorites ? "bg-purple-600" : ""}
            >
              즐겨찾기 ({favoriteCards.length})
            </Button>
          </div>
        </div>



        {/* 명함 목록 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">명함을 불러오는 중...</p>
            </div>
          ) : filteredCards.length > 0 ? (
            filteredCards.map((collection) => {
              const card = collection.business_cards
              if (!card) return null

              return (
                <Card
                  key={collection.id}
                  className="cursor-pointer hover:shadow-md transition-shadow relative"
                  onClick={() => router.push(`/saved-cards/${collection.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {card.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{card.full_name || '이름 없음'}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFavorite(collection.id, !collection.is_favorite)
                            }}
                            className={collection.is_favorite ? "text-yellow-500" : "text-gray-400"}
                          >
                            <Star className={`w-4 h-4 ${collection.is_favorite ? "fill-current" : ""}`} />
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {card.company || '회사 없음'} / {card.role || '직책 없음'}
                        </p>

                        {/* 키워드 태그 */}
                        {card.keywords && card.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {card.keywords.slice(0, 3).map((keyword: string, index: number) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 메모 */}
                        {collection.memo && (
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-sm text-gray-600 flex-1">{collection.memo}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/saved-cards/${collection.id}`)
                              }}
                              className="text-gray-400 p-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        {/* 수집 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(collection.collected_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}</span>
                          {collection.event_id && (
                            <span>이벤트에서 수집</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showFavorites ? '즐겨찾기된 명함이 없습니다' : '수집된 명함이 없습니다'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {showFavorites
                  ? '즐겨찾기할 명함을 찾아보세요!'
                  : '명함을 스캔하여 수집을 시작해보세요!'
                }
              </p>
              <Link href="/scan-card">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  명함 스캔하기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
