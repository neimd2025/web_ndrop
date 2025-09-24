import { UserEventsJoinSimpleClient } from '@/components/user/user-events-join-simple-client'
import { getUserEventsData } from '@/lib/supabase/user-server-actions'

export const dynamic = 'force-dynamic'

export default async function EventsJoinPage() {
  const { user, userParticipations } = await getUserEventsData()

  return (
    <UserEventsJoinSimpleClient
      user={user}
      userParticipations={userParticipations}
    />
  )
}
