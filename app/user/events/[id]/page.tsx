import { getUserEventsData } from '@/lib/supabase/user-server-actions'
import { UserEventDetailClient } from '@/components/user/user-event-detail-client'
import { notFound } from 'next/navigation'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const { user, events } = await getUserEventsData()
  const event = events.find(e => e.id === id)

  if (!event) {
    notFound()
  }

  return (
    <UserEventDetailClient
      user={user}
      event={event}
    />
  )
}