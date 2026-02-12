import { UserScanCardClient } from '@/components/user/user-scan-card-client'
import { getUserAuth } from '@/lib/supabase/user-server-actions'

export const dynamic = 'force-dynamic'

export default async function ScanCardPage() {
  const user = await getUserAuth()

  return (
    <UserScanCardClient user={user} />
  )
}
