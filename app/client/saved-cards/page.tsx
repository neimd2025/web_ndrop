import { UserSavedCardsClient } from '@/components/user/user-saved-cards-client'
import { getUserSavedCardsData } from '@/lib/supabase/user-server-actions'

export default async function SavedCardsPage() {
  const { user, savedCards } = await getUserSavedCardsData()

  return <UserSavedCardsClient user={user} savedCards={savedCards} />
}
