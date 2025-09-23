import { UserEventsJoinClient } from '@/components/user/user-events-join-client'
import { getUserEventsData } from '@/lib/supabase/user-server-actions'

export const dynamic = 'force-dynamic'

export default async function EventsJoinPage() {
  const { user, events, userParticipations } = await getUserEventsData()

  return (
    <UserEventsJoinClient
      user={user}
      events={events}
      userParticipations={userParticipations}
    />
  )
}
