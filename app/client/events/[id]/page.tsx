//@ts-nocheck
import { EventDetailPageClient } from '@/components/user/event-detail-page-client'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientEventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 이벤트 데이터 가져오기
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">이벤트를 찾을 수 없습니다</h1>
          <p className="text-gray-600">요청하신 이벤트가 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    )
  }

  // 사용자가 참가한 이벤트인지 확인
  const { data: participation } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const isParticipating = !!participation

  return (
    <div className="min-h-screen">
      <EventDetailPageClient
        event={event}
        initialParticipation={isParticipating}
        userId={user.id}
      />
    </div>
  )
}
