"use client"

import { UserProfile } from '@/lib/supabase/user-server-actions'

interface UserScanCardClientProps {
  user: UserProfile
}

export function UserScanCardClient({ user }: UserScanCardClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">QR 코드 스캔</h1>
        <p>QR 코드 스캔 기능 구현 예정</p>
      </div>
    </div>
  )
}