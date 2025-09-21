import { createClient } from '@/utils/supabase/server'
import { PublicBusinessCardClient } from '@/components/public/public-business-card-client'
import { notFound } from 'next/navigation'

interface PublicBusinessCardPageProps {
  params: Promise<{ id: string }>
}

// 공개 명함 데이터 가져오기 (인증 불필요)
async function getPublicBusinessCardData(cardId: string) {
  try {
    const supabase = await createClient()

    const { data: businessCard, error } = await supabase
      .from('business_cards')
      .select(`
        *,
        user_profiles!inner(
          id,
          full_name,
          email,
          profile_image_url
        )
      `)
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
    notFound()
  }
}