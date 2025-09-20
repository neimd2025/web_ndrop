import { getUserEventsData } from '@/lib/supabase/user-server-actions'
import { UserEventsJoinClient } from '@/components/user/user-events-join-client'

export default async function EventsJoinPage() {
  const { user, events } = await getUserEventsData()

  return (
    <UserEventsJoinClient
      user={user}
      events={events}
    />
  )
}