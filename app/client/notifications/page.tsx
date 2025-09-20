import { getUserNotificationsData } from '@/lib/supabase/user-server-actions'
import { UserNotificationsClient } from '@/components/user/user-notifications-client'

export default async function NotificationsPage() {
  const { user, notifications } = await getUserNotificationsData()

  return (
    <UserNotificationsClient
      user={user}
      initialNotifications={notifications}
    />
  )
}