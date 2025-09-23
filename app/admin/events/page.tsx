import { AdminEventsClient } from '@/components/admin/admin-events-client'
import { getAdminEventsData } from '@/lib/supabase/admin-server-actions'

export const dynamic = 'force-dynamic'

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
  status: "upcoming" | "ongoing" | "completed"
  max_participants: number
  current_participants?: number
  event_code: string
  created_at: string
  updated_at: string
  image_url?: string
  organizer_name?: string
  organizer_email?: string
  organizer_phone?: string
  organizer_kakao?: string
}

interface Participant {
  id: string
  name: string
  email: string
  phone: string
  university?: string
  major?: string
  company?: string
  position?: string
  interests: string
  event_id: string
}

export default async function AdminEventsPage() {
  // Fetch events data on server side
  const events = await getAdminEventsData()




  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminEventsClient initialEvents={events} />
    </div>
  )
}
