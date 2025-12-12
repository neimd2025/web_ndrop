// @ts-nocheck
import { getUserSavedCardsDataFromId, getUserCardFromId } from '@/lib/supabase/user-server-actions'
import UserTheirCardDetailPage from '@/components/user/user-their-card-detail'
import { notFound } from 'next/navigation'

interface UserCardClientPageProps {
  params: Promise<{ id: string }>
}

export default async function UserCardClientPage({ params }: UserCardClientPageProps) {
  const { id } = await params
  
  console.log('전달된 ID:', id, 'UUID 형식인가?', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
  
  try {
    const { user: cardUser, cardData, isCollected, cardType, cardOwner: cardOwner } = await getUserCardFromId(id)

    // 3. 일반 명함 데이터로 명함 상세 페이지 렌더링
    return (
      <UserTheirCardDetailPage
        user={cardUser}
        businessCards={[cardData]} // 배열로 감싸서 전달
        cardOwner={cardOwner}
      />
    )
    
  } catch (error) {
    console.error('명함 데이터 조회 중 오류:', error);
    console.error('에러 상세:', error.message, error.stack);
    return notFound();
  }
}
