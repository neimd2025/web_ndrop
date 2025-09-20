import { getAdminNotificationsData, getAdminEventsData } from '@/lib/supabase/admin-server-actions'
import { AdminNotificationsClient } from '@/components/admin/admin-notifications-client'

export default async function AdminNotificationsPage() {
  // Fetch data on server side
  const [notifications, events] = await Promise.all([
    getAdminNotificationsData(),
    getAdminEventsData()
  ])

  return (
    <div className="min-h-screen">
      <AdminNotificationsClient
        initialNotifications={notifications}
        initialEvents={events}
      />
    </div>
  )
}