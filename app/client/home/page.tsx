import { getUserHomeData } from '@/lib/supabase/user-server-actions'
import { UserHomeClient } from '@/components/user/user-home-client'

export default async function HomePage() {
  const { user, upcomingEvents, recentNotifications, businessCardStats } = await getUserHomeData()

  return (
    <UserHomeClient
      user={user}
      upcomingEvents={upcomingEvents}
      recentNotifications={recentNotifications}
      businessCardStats={businessCardStats}
    />
  )
}