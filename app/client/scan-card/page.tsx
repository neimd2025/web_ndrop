import { getUserAuth } from '@/lib/supabase/user-server-actions'
import { UserScanCardClient } from '@/components/user/user-scan-card-client'
import { redirect } from 'next/navigation'

export default async function ScanCardPage() {
  const user = await getUserAuth()

  if (!user) {
    redirect('/login?type=user')
  }

  return (
    <UserScanCardClient user={user} />
  )
}