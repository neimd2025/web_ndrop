import { getUserSavedCardsData } from '@/lib/supabase/user-server-actions'
import { UserSavedCardDetailClient } from '@/components/user/user-saved-card-detail-client'
import { notFound } from 'next/navigation'

interface SavedCardDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SavedCardDetailPage({ params }: SavedCardDetailPageProps) {
  const { id } = await params
  const { user, savedCards } = await getUserSavedCardsData()
  const savedCard = savedCards.find(card => card.id === id)

  if (!savedCard) {
    notFound()
  }

  return (
    <UserSavedCardDetailClient
      user={user}
      savedCard={savedCard}
    />
  )
}