import { EventDetailCard } from '@/components/ui/event-detail-card'
import { createClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  // 관리자 인증 확인
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value

  if (!adminToken) {
    redirect('/admin/login')
  }

  let decoded: any
  try {
    decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'fallback-secret') as any
    if (decoded.role_id !== 2) {
      redirect('/admin/login')
    }
  } catch (error) {
    redirect('/admin/login')
  }

  // 이벤트 데이터 가져오기
  const supabase = await createClient()
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

  // 관리자가 생성한 이벤트인지 확인
  if (event.created_by && event.created_by !== decoded.adminId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600">이 이벤트에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EventDetailCard
        event={event}
        showEventCode={true}
        showOrganizerInfo={true}
        backUrl="/admin/events"
      />
    </div>
  )
}
