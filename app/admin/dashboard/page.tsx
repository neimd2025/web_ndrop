import { getEventsData } from '@/lib/supabase/server-actions'
import { DashboardClient } from '@/components/admin/dashboard-client'

export default async function AdminDashboard() {
  // Fetch events on the server side
  const events = await getEventsData()

  return (
    <div className="min-h-screen bg-white">
      <DashboardClient initialEvents={events} />
    </div>
  )
}
