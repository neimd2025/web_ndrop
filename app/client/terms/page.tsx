import { getUserAuth } from '@/lib/supabase/user-server-actions'
import { UserTermsClient } from '@/components/user/user-terms-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const user = await getUserAuth()

  if (!user) {
    redirect('/login?type=user')
  }

  return (
    <UserTermsClient user={user} />
  )
}