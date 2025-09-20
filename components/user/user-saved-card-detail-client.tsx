"use client"

import { UserProfile } from '@/lib/supabase/user-server-actions'

interface UserSavedCardDetailClientProps {
  user: UserProfile
  savedCard: any
}

export function UserSavedCardDetailClient({ user, savedCard }: UserSavedCardDetailClientProps) {
  const businessCard = savedCard.business_card

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">저장된 명함 상세</h1>
        {businessCard && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">{businessCard.name}</h2>
            <p className="mb-2">{businessCard.title} / {businessCard.company}</p>
            <p className="text-sm text-gray-600">{businessCard.bio}</p>
            {businessCard.email && <p className="text-sm text-gray-600">이메일: {businessCard.email}</p>}
            {businessCard.phone && <p className="text-sm text-gray-600">전화: {businessCard.phone}</p>}
          </div>
        )}
        <p className="text-sm text-gray-500">
          저장일: {new Date(savedCard.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}