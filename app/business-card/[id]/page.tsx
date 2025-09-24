import { PublicBusinessCardClient } from '@/components/public/public-business-card-client'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

interface PublicBusinessCardPageProps {
  params: Promise<{ id: string }>
}

// 공개 명함 데이터 가져오기 (인증 불필요)
async function getPublicBusinessCardData(cardId: string) {
  try {
    // 서비스 역할 키를 사용하여 RLS 우회
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 먼저 명함이 존재하는지 확인
    const { data: cardExists, error: existsError } = await supabase
      .from('business_cards')
      .select('id, is_public')
      .eq('id', cardId)
      .single()

    if (existsError || !cardExists) {
      throw new Error('NOT_FOUND')
    }

    if (!cardExists.is_public) {
      throw new Error('NOT_PUBLIC')
    }

    // 공개된 명함 데이터 가져오기
    const { data: businessCard, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', cardId)
      .eq('is_public', true)
      .single()

    if (error || !businessCard) {
      throw new Error('공개된 명함을 찾을 수 없습니다.')
    }

    return businessCard
  } catch (error) {
    console.error('공개 명함 데이터 가져오기 오류:', error)
    throw error
  }
}

export default async function PublicBusinessCardPage({ params }: PublicBusinessCardPageProps) {
  try {
    const { id } = await params
    const businessCard = await getPublicBusinessCardData(id)

    return (
      <PublicBusinessCardClient businessCard={businessCard} />
    )
  } catch (error) {
    // 에러 타입에 따라 다른 처리
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND' || error.message === 'NOT_PUBLIC') {
        // 특정 에러는 error.tsx에서 처리
        throw error
      }
    }
    // 기타 에러는 404 페이지로
    notFound()
  }
}
