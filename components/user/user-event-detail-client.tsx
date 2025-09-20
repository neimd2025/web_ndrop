"use client"

import { UserProfile, UserEvent } from '@/lib/supabase/user-server-actions'

interface UserEventDetailClientProps {
  user: UserProfile
  event: UserEvent
}

export function UserEventDetailClient({ user, event }: UserEventDetailClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">{event.title}</h1>
        <p className="mb-2">{event.description}</p>
        <p className="text-sm text-gray-600">위치: {event.location}</p>
        <p className="text-sm text-gray-600">참가자: {event.current_participants}/{event.max_participants}</p>
      </div>
    </div>
  )
}