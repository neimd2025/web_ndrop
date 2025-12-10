import { UserMyPageClient } from '@/components/user/user-my-page-client'
import { getUserMyPageData } from '@/lib/supabase/user-server-actions'

export default async function MyPage() {
  try {
    const { user, businessCards, participatedEvents, stats } = await getUserMyPageData()

    return (
      <UserMyPageClient
        user={user}
        businessCards={businessCards}
        participatedEvents={participatedEvents}
        stats={stats}
      />
    )
  } catch (error) {
    console.error('마이페이지 데이터 로드 오류:', error)
    throw error;
  }
}
