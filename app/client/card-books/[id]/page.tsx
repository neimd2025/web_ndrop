import { getUserSavedCardsDataFromId } from '@/lib/supabase/user-server-actions'
import UserTheirCardDetailPage from '@/components/user/user-their-card-detail'
import { notFound } from 'next/navigation'

interface UserCardClientPageProps {
  params: Promise<{ id: string }>
}

export default async function UserCardClientPage({ params }: UserCardClientPageProps) {
  const { id } = await params
  const { savedCards } = await getUserSavedCardsDataFromId(id);

  return (
    <UserTheirCardDetailPage
      businessCards={savedCards}
    />
  )
}