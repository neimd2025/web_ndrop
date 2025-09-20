"use client"

import { UserProfile, UserBusinessCard } from '@/lib/supabase/user-server-actions'

interface UserBusinessCardDetailClientProps {
  user: UserProfile
  profile: UserProfile
  businessCards: UserBusinessCard[]
  isOwnProfile: boolean
}

export function UserBusinessCardDetailClient({
  user,
  profile,
  businessCards,
  isOwnProfile
}: UserBusinessCardDetailClientProps) {
  const primaryCard = businessCards[0]

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">{profile.full_name || profile.email}</h1>
        {primaryCard && (
          <div className="mb-4">
            <p className="mb-2">{primaryCard.title} / {primaryCard.company}</p>
            <p className="text-sm text-gray-600">{primaryCard.bio}</p>
            {primaryCard.email && <p className="text-sm text-gray-600">이메일: {primaryCard.email}</p>}
            {primaryCard.phone && <p className="text-sm text-gray-600">전화: {primaryCard.phone}</p>}
          </div>
        )}
        {isOwnProfile && <p className="text-sm text-gray-500">내 명함입니다</p>}
      </div>
    </div>
  )
}