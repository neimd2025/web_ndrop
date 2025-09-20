"use client"

import { UserProfile, UserEvent } from '@/lib/supabase/user-server-actions'

interface UserEventsJoinClientProps {
  user: UserProfile
  events: UserEvent[]
}

export function UserEventsJoinClient({ user, events }: UserEventsJoinClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">이벤트 참가</h1>
        <p>이벤트 참가 기능 구현 예정</p>
        <p>총 {events.length}개의 이벤트</p>
      </div>
    </div>
  )
}