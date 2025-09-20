import { getUserMyPageData } from '@/lib/supabase/user-server-actions'
import { UserMyPageClient } from '@/components/user/user-my-page-client'

export default async function MyPage() {
  const { user, businessCards, participatedEvents, stats } = await getUserMyPageData()

  return (
    <UserMyPageClient
      user={user}
      businessCards={businessCards}
      participatedEvents={participatedEvents}
      stats={stats}
    />
  )
}