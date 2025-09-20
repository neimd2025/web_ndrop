import { getUserBusinessCardsData } from '@/lib/supabase/user-server-actions'
import { UserMyNamecardClient } from '@/components/user/user-my-namecard-client'

export default async function MyNamecardPage() {
  const { user, businessCards } = await getUserBusinessCardsData()

  return (
    <UserMyNamecardClient
      user={user}
      businessCards={businessCards}
    />
  )
}