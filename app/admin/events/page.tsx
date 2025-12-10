export const dynamic = 'force-dynamic'
import { AdminEventsClient } from '@/components/admin/admin-events-client'

export const dynamic = 'force-dynamic'

export default function AdminEventsPage() {
  return (
    <div className="min-h-screen ">
      <AdminEventsClient initialEvents={[]} />
    </div>
  )
}
