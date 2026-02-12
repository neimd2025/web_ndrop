// @ts-nocheck
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
    router.push(`/card-books/${cardId}`)
  }, [router])

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Animation Elements */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between sticky top-0 z-20">
          <Button variant="ghost" size="sm" className="p-2 -ml-2 text-white hover:text-white/80 hover:bg-white/10" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">명함첩</h1>
          <div className="w-10" />
        </div>

        {/* 검색 및 필터 */}
        <div className="px-5 py-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="이름, 회사, 직책으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500 rounded-xl"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={!showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(false)}
              className={!showFavorites ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"}
            >
              전체 ({savedCards.length})
            </Button>
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(true)}
              className={showFavorites ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"}
            >
              <Star className="h-3 w-3 mr-1" />
              즐겨찾기 ({favoriteCards.length})
            </Button>
          </div>
        </div>

        {/* 명함 목록 */}
        <div className="px-5 pb-6 space-y-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5 backdrop-blur-sm">
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showFavorites ? '즐겨찾기한 명함이 없습니다' : '저장된 명함이 없습니다'}
              </h3>
              <p className="text-slate-400 mb-6">
                {showFavorites ? '명함을 즐겨찾기에 추가해보세요' : 'QR 코드를 스캔해서 명함을 수집해보세요'}
              </p>
              {!showFavorites && (
                <Link href="/client/scan-card">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20">명함 스캔하기</Button>
                </Link>
              )}
            </div>
          ) : (
            filteredCards.map((card) => {
              const businessCard = card.business_card
              if (!businessCard) return null

              return (
                <div key={card.id}>
                  {/* 명함 카드 */}
                  <Card
                    className="border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-purple-500/50 transition-all duration-200 cursor-pointer relative overflow-hidden group"
                    onClick={(e) => handleCardClick(card.id, e)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardContent className="p-4 flex items-start gap-3 relative z-10">
                      {/* 즐겨찾기 별 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(card.id) }}
                        className="absolute top-2 right-2 p-1 hover:bg-white/10 z-20 text-slate-400 hover:text-white"
                      >
                        <Star
                          className={`h-5 w-5 ${card.is_favorite ? 'text-yellow-400 fill-current' : ''}`}
                        />
                      </Button>

                      <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center mt-1 shadow-inner">
                        {businessCard.profile_image_url ? (
                          <img 
                            src={businessCard.profile_image_url} 
                            alt={businessCard.full_name || businessCard.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="font-bold text-white text-lg truncate">{businessCard.full_name || businessCard.name}</h3>
                        <p className="text-sm text-purple-300 font-medium truncate mb-0.5">
                          {businessCard?.company || businessCard?.affiliation} 
                          {(businessCard?.company && businessCard?.job_title) && ' · '}
                          {businessCard?.job_title || businessCard?.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate mb-2">
                          {businessCard?.work_field || '직무 미입력'}
                        </p>
                        
                        {(businessCard.email || businessCard.contact) && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             <span className="truncate">{businessCard.email || businessCard.contact}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-600 mt-2 text-right">
                          {new Date(card.collected_at || card.created_at).toLocaleDateString()} 저장됨
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
    </div>
  )
}
