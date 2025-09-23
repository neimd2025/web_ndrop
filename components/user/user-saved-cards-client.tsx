"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Edit, Search, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserSavedCardsClientProps {
  user?: UserProfile
  savedCards?: any[]
}

export function UserSavedCardsClient({ user: initialUser, savedCards: initialSavedCards }: UserSavedCardsClientProps = {}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [savedCards, setSavedCards] = useState<any[]>(initialSavedCards || [])
  const [loading, setLoading] = useState(!initialUser)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const router = useRouter()

  // 즐겨찾기된 명함 필터링
  const favoriteCards = savedCards.filter(card => card.is_favorite)

  // 검색어로 필터링
  const filteredCards = (showFavorites ? favoriteCards : savedCards).filter(card => {
    if (!searchTerm) return true
    const businessCard = card.business_card
    if (!businessCard) return false

    const searchFields = [
      businessCard.name,
      businessCard.company,
      businessCard.title,
      businessCard.email
    ].filter(Boolean).join(' ').toLowerCase()

    return searchFields.includes(searchTerm.toLowerCase())
  })

  const handleToggleFavorite = async (cardId: string) => {
    try {
      const supabase = createClient()
      const card = savedCards.find(c => c.id === cardId)
      if (!card) return

      const { error } = await supabase
        .from('collected_cards')
        .update({ is_favorite: !card.is_favorite })
        .eq('id', cardId)

      if (error) {
        console.error('즐겨찾기 업데이트 오류:', error)
        alert('즐겨찾기 상태 변경에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      card.is_favorite = !card.is_favorite
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('오류가 발생했습니다.')
    }
  }

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">저장된 명함</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6">
        {/* 검색 및 필터 */}
        <div className="space-y-4 mb-6">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="이름, 회사, 직책으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
            />
          </div>

          {/* 필터 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={!showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(false)}
              className={!showFavorites ? "bg-purple-600" : ""}
            >
              전체 ({savedCards.length})
            </Button>
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(true)}
              className={showFavorites ? "bg-purple-600" : ""}
            >
              <Star className="h-3 w-3 mr-1" />
              즐겨찾기 ({favoriteCards.length})
            </Button>
          </div>
        </div>

        {/* 명함 목록 */}
        <div className="space-y-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showFavorites ? '즐겨찾기한 명함이 없습니다' : '저장된 명함이 없습니다'}
              </h3>
              <p className="text-gray-600 mb-6">
                {showFavorites ? '명함을 즐겨찾기에 추가해보세요' : 'QR 코드를 스캔해서 명함을 수집해보세요'}
              </p>
              {!showFavorites && (
                <Link href="/client/scan-card">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    명함 스캔하기
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredCards.map((card) => {
              const businessCard = card.business_card
              if (!businessCard) return null

              return (
                <Card key={card.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* 프로필 이미지 */}
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {getInitial(businessCard.name)}
                        </span>
                      </div>

                      {/* 명함 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900">{businessCard.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(card.id)}
                            className="p-1"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                card.is_favorite
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          {businessCard.title} / {businessCard.company}
                        </p>

                        {businessCard.email && (
                          <p className="text-sm text-gray-500">{businessCard.email}</p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          저장일: {new Date(card.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col space-y-1">
                        <Link href={`/client/saved-cards/${card.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            상세
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
