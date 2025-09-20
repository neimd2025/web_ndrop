import { getAdminEventsData } from '@/lib/supabase/admin-server-actions'
import { AdminEventParticipantsClient } from '@/components/admin/admin-event-participants-client'
import { notFound } from 'next/navigation'

interface AdminEventParticipantsPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEventParticipantsPage({ params }: AdminEventParticipantsPageProps) {
  const { id } = await params
  const events = await getAdminEventsData()
  const event = events.find(e => e.id === id)

  if (!event) {
    notFound()
  }

  return (
    <AdminEventParticipantsClient
      event={event}
    />
  )
}