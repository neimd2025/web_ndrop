import { getUserAuth } from '@/lib/supabase/user-server-actions'
import { UserOnboardingClient } from '@/components/user/user-onboarding-client'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const user = await getUserAuth()

  if (!user) {
    redirect('/login?type=user')
  }

  return (
    <UserOnboardingClient user={user} />
  )
}