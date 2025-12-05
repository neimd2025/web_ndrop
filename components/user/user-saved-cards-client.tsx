"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { ArrowLeft, Search, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

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
  const profileImage = user?.profile_image_url

  // 데이터 로딩
  useEffect(() => {
    if (initialUser) return
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/user/saved-cards')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setSavedCards(data.savedCards || [])
        }
      } catch (error) {
        console.error('저장된 명함 데이터 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [initialUser])

  // 즐겨찾기 필터
  const favoriteCards = savedCards.filter(card => card.is_favorite)

  // 검색어 필터
  const filteredCards = (showFavorites ? favoriteCards : savedCards).filter(card => {
    if (!searchTerm) return true
    const businessCard = card.business_card
    if (!businessCard) return false
    const searchFields = [
      businessCard.full_name || businessCard.name,
      businessCard.company || businessCard.affiliation,
      businessCard.job_title || businessCard.title,
      businessCard.email || businessCard.contact
    ].filter(Boolean).join(' ').toLowerCase()
    return searchFields.includes(searchTerm.toLowerCase())
  })

  const handleToggleFavorite = async (cardId: string) => {
    try {
      const supabase = createClient()
      const card = savedCards.find(c => c.id === cardId)
      if (!card) return
      
      const newFavoriteStatus = !card.is_favorite
      
      // UI 먼저 업데이트
      card.is_favorite = newFavoriteStatus
      setSavedCards([...savedCards])

      // Supabase에 업데이트
      const { error } = await supabase
        .from('collected_cards')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', cardId)

      if (error) {
        // 실패 시 UI 롤백
        card.is_favorite = !newFavoriteStatus
        setSavedCards([...savedCards])
        throw error
      }
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('즐겨찾기 상태 변경에 실패했습니다.')
    }
  }

  // 카드 클릭 핸들러
  const handleCardClick = useCallback((cardId: string, e: React.MouseEvent) => {
    // 즐겨찾기 버튼을 클릭한 경우에는 네비게이션 막기
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault()
      return
    }
    router.push(`/client/card-books/${cardId}`)
  }, [router])

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="p-2" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 text-gray-900" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">명함첩</h1>
        <div className="w-10" />
      </div>

      {/* 검색 및 필터 */}
      <div className="px-5 py-6 space-y-4">
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

        <div className="flex gap-2">
          <Button
            variant={!showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(false)}
            className={!showFavorites ? "bg-purple-600 text-white" : ""}
          >
            전체 ({savedCards.length})
          </Button>
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(true)}
            className={showFavorites ? "bg-purple-600 text-white" : ""}
          >
            <Star className="h-3 w-3 mr-1" />
            즐겨찾기 ({favoriteCards.length})
          </Button>
        </div>
      </div>

      {/* 명함 목록 */}
      <div className="px-5 pb-6 space-y-4">
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
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">명함 스캔하기</Button>
              </Link>
            )}
          </div>
        ) : (
          filteredCards.map((card) => {
            const businessCard = card.business_card
            if (!businessCard) return null

            return (
// 명함 카드 부분 수정
<div key={card.id}>
  {/* 명함 카드 - relative 추가 */}
  <Card
    className="border border-gray-200 hover:border-purple-300 transition-all duration-200 cursor-pointer relative" // relative 추가
    onClick={(e) => handleCardClick(card.id, e)}
  >
    <CardContent className="p-4 flex items-start gap-1.5">
      {/* 즐겨찾기 별 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(card.id) }}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 z-10" // 위치 조정
      >
        <Star
          className={`h-6 w-6 ${card.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
        />
      </Button>

      {/* 나머지 코드는 동일 */}
      <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center mt-1">
        {businessCard.profile_image_url ? (
          <img 
            src={businessCard.profile_image_url} 
            alt={businessCard.full_name || businessCard.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <User className="w-8 h-8 text-white" />
        )}
      </div>

      <div className="flex-1 ml-3">
        <h3 className="font-bold text-gray-900">{businessCard.full_name || businessCard.name}</h3>
                  <p className="text-sm text-gray-600">
                    {businessCard?.job_title || businessCard?.company || businessCard?.work_field }
                  </p>
        {(businessCard.email || businessCard.contact) && (
          <p className="text-sm text-gray-500">{businessCard.email || businessCard.contact}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          저장일: {new Date(card.collected_at || card.created_at).toLocaleDateString()}
        </p>
      </div>
    </CardContent>
  </Card>
</div>
            )
          })
        )}
      </div>
    </div>
  )
}