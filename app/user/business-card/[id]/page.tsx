import { getUserProfileData } from '@/lib/supabase/user-server-actions'
import { UserBusinessCardDetailClient } from '@/components/user/user-business-card-detail-client'
import { notFound } from 'next/navigation'

interface BusinessCardDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BusinessCardDetailPage({ params }: BusinessCardDetailPageProps) {
  try {
    const { id } = await params
    const { user, profile, businessCards, isOwnProfile } = await getUserProfileData(id)

    return (
      <UserBusinessCardDetailClient
        user={user}
        profile={profile}
        businessCards={businessCards}
        isOwnProfile={isOwnProfile}
      />
    )
  } catch (error) {
    notFound()
  }
}