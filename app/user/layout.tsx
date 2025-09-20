import { getUserAuth } from '@/lib/supabase/user-server-actions'
import { UserLayoutClient } from '@/components/user/user-layout-client'
import { redirect } from 'next/navigation'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserAuth()

  if (!user) {
    redirect('/login?type=user&returnTo=/user/home')
  }

  return (
    <UserLayoutClient user={user}>
      {children}
    </UserLayoutClient>
  )
}