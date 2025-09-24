import { UserEventScanClient } from '@/components/user/user-event-scan-client'
import { getUserAuth } from '@/lib/supabase/user-server-actions'

export default async function EventScanPage() {
  const user = await getUserAuth()

  return (
    <UserEventScanClient user={user} />
  )
}
