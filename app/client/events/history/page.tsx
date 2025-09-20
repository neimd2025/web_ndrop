import { getUserEventsData } from '@/lib/supabase/user-server-actions'
import { UserEventsHistoryClient } from '@/components/user/user-events-history-client'

export default async function EventsHistoryPage() {
  const { user, events, userParticipations } = await getUserEventsData()

  return (
    <UserEventsHistoryClient
      user={user}
      events={events}
      userParticipations={userParticipations}
    />
  )
}