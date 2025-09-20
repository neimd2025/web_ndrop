"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useBusinessCards } from "@/hooks/use-business-cards"
import { createClient } from "@/utils/supabase/client"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Share2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export default function PublicBusinessCardPage() {
  const router = useRouter()
  const params = useParams()
  const cardId = params.id
  const { user } = useAuth()
  const { collectCard } = useBusinessCards()
  const [isCollected, setIsCollected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnCard, setIsOwnCard] = useState(false)
  const supabase = createClient()

  // 명함 데이터 가져오기
  const fetchBusinessCard = useCallback(async () => {
    if (!cardId) return

    try {
      setLoading(true)
      // 먼저 business_cards만 조회
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single()

      if (cardError) {
        console.error('명함 가져오기 오류:', cardError)
        toast.error('명함을 불러오는데 실패했습니다.')
        return
      }

      // user_profiles 데이터가 있으면 별도로 조회
      let profileData = null
      if (cardData.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, contact, company, role, mbti, keywords, introduction, profile_image_url')
          .eq('id', cardData.user_id)
          .single()

        if (!profileError) {
          profileData = profile
        }
      }

      // 데이터 합치기
      const combinedData = {
        ...cardData,
        user_profiles: profileData
      }

      setCard(combinedData)

      // 명함 소유자 확인
      if (user && cardData.user_id === user.id) {
        setIsOwnCard(true)
      } else {
        setIsOwnCard(false)
      }
    } catch (error) {
      console.error('명함 가져오기 오류:', error)
      toast.error('명함을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [cardId, user])

  useEffect(() => {
    fetchBusinessCard()
  }, [fetchBusinessCard])

  // 이미 수집된 명함인지 확인
  const checkIfCollected = useCallback(async () => {
    if (!user || !cardId) return

    try {
      const { data, error } = await supabase
        .from('collected_cards')
        .select('*')
        .eq('collector_id', user.id)
        .eq('card_id', cardId)
        .maybeSingle() // single() 대신 maybeSingle() 사용

      if (!error && data) {
        setIsCollected(true)
      } else {
        setIsCollected(false)
      }
    } catch (error) {
      console.log('수집 상태 확인 중 오류 (정상적인 경우):', error)
      setIsCollected(false)
    }
  }, [user, cardId])

  useEffect(() => {
    checkIfCollected()
  }, [checkIfCollected])

  // 명함 수집 함수
  const handleCollectCard = async () => {
    if (!user || !card || isCollected) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('collected_cards')
        .insert({
          collector_id: user.id,
          card_id: card.id,
          collected_at: new Date().toISOString(),
          is_favorite: false
        })

      if (error) {
        console.error('명함 수집 오류:', error)
        toast.error('명함 수집에 실패했습니다.')
        return
      }

      setIsCollected(true)
      toast.success('명함이 성공적으로 수집되었습니다!')

      // 성공 메시지 표시 후 수집된 명함 목록으로 이동
      setTimeout(() => {
        router.push('/saved-cards')
      }, 1000)

    } catch (error) {
      console.error('명함 수집 중 오류:', error)
      toast.error('명함 수집에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 공유 함수
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${card?.full_name}님의 명함`,
          text: `${card?.full_name}님의 디지털 명함을 확인해보세요!`,
          url: window.location.href
        })
      } else {
        // 공유 API가 지원되지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 클립보드에 복사되었습니다!')
      }
    } catch (error) {
      console.error('공유 중 오류:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="p-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">명함 상세</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">명함을 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="p-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">명함 상세</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">명함을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="p-2" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">명함 상세</h1>
          <Button variant="ghost" size="sm" className="p-2" onClick={handleShare}>
            <Share2 className="w-4 h-4 text-gray-900" />
          </Button>
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            {/* 프로필 섹션 */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full mx-auto mb-5 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {card.full_name ? card.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {card.full_name || card.user_profiles?.full_name || '사용자'}
              </h2>
              <p className="text-gray-600 text-base mb-4">
                {card.introduction || card.user_profiles?.introduction || ''}
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                {(card.company || card.user_profiles?.company || card.role || card.user_profiles?.role) && (
                  <p>
                    {card.company || card.user_profiles?.company || ''}
                    {(card.company || card.user_profiles?.company) && (card.role || card.user_profiles?.role) && ' / '}
                    {card.role || card.user_profiles?.role || ''}
                  </p>
                )}
                {(card.mbti || card.user_profiles?.mbti) && (
                  <p>MBTI: {card.mbti || card.user_profiles?.mbti}</p>
                )}
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="space-y-4">
              {(card.contact || card.user_profiles?.contact || card.email) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">연락처</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {card.contact || card.user_profiles?.contact && (
                      <p>📞 {card.contact || card.user_profiles?.contact}</p>
                    )}
                    {card.email && (
                      <p>📧 {card.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 키워드/태그 */}
              {(card.keywords && card.keywords.length > 0) || (card.user_profiles?.keywords && card.user_profiles.keywords.length > 0) ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">키워드</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(card.keywords || card.user_profiles?.keywords || []).map((keyword: string, index: number) => (
                      <Badge key={index} className="bg-purple-600 text-white px-3 py-1">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 외부 링크 */}
              {card.external_link && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">외부 링크</h4>
                  <p className="text-gray-500 text-sm">{card.external_link}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
         <div className=" w-full max-w-md px-5 py-6 bg-white border-t border-gray-200 shadow-lg">
        {!user ? (
          // 로그인하지 않은 경우
          <Button
            className="w-full h-15 font-semibold text-lg bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => router.push('/login')}
          >
            로그인하여 명함 수집하기
          </Button>
        ) : isOwnCard ? (
          // 자신의 명함인 경우
          <div className="space-y-3">
            <Button
              className="w-full h-15 font-semibold text-lg bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => router.push('/my-namecard')}
            >
              내 명함 관리하기
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 font-medium border-purple-600 text-purple-600 hover:bg-purple-50"
              onClick={() => router.push('/my-qr')}
            >
              내 QR코드 보기
            </Button>
          </div>
        ) : (
          // 다른 사람의 명함인 경우
          <Button
            className={`w-full h-15 font-semibold text-lg ${
              isCollected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            disabled={isLoading || isCollected}
            onClick={handleCollectCard}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                수집 중...
              </div>
            ) : isCollected ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                수집 완료
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                명함 수집하기
              </>
            )}
          </Button>
        )}
      </div>
      </div>

      {/* 하단 고정 버튼 */}

    </div>
  )
}
