import { UserEventsAvailableClient } from '@/components/user/user-events-available-client'
import { getUserEventsAvailableData } from '@/lib/supabase/user-server-actions'

export const dynamic = 'force-dynamic'

export default async function EventsAvailablePage() {
  const { user, availableEvents } = await getUserEventsAvailableData()

  return (
    <UserEventsAvailableClient
      user={user}
      availableEvents={availableEvents}
    />
  )
}
