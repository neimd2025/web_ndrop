export const dynamic = 'force-dynamic'
import { getUserBusinessCardsData } from '@/lib/supabase/user-server-actions'
import { UserMyQRClient } from '@/components/user/user-my-qr-client'

export default async function MyQRPage() {
  const { user, businessCards } = await getUserBusinessCardsData()

  return (
    <UserMyQRClient
      user={user}
      businessCards={businessCards}
    />
  )
}
