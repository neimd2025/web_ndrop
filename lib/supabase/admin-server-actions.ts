import { createClient } from '@/utils/supabase/server'
import { calculateEventStatus } from './database'

export interface AdminEvent {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
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

export interface AdminMember {
  id: string
  full_name: string
  email: string
  company: string
  role: string
  created_at: string
  profile_image_url: string | null
  role_id: number
}

export interface AdminNotification {
  id: string
  title: string
  message: string
  target_type: "all" | "specific" | "event_participants"
  target_event?: string
  target_event_id?: string
  sent_date?: string
  delivered_count: number
  read_count: number
  status: "draft" | "sent" | "scheduled"
  created_at: string
  updated_at: string
  target_ids?: string[]
}

export async function getAdminEventsData(): Promise<AdminEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAdminEventsData:', error)
    return []
  }
}

export async function getAdminMembersData(): Promise<AdminMember[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin members:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAdminMembersData:', error)
    return []
  }
}

export async function getAdminNotificationsData(): Promise<AdminNotification[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAdminNotificationsData:', error)
    return []
  }
}

export async function getEventParticipants(eventId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        user_profiles!event_participants_user_profiles_fkey(full_name, email, company, role)
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('Error fetching event participants:', error)
      return []
    }

    // 데이터 형식 변환
    const formattedParticipants = (data || []).map((item: any) => ({
      id: item.id,
      name: item.user_profiles?.full_name || '알 수 없음',
      email: item.user_profiles?.email || '알 수 없음',
      phone: '', // event_participants 테이블에는 phone 필드가 없으므로 빈 문자열
      university: '', // event_participants 테이블에는 university 필드가 없으므로 빈 문자열
      major: '', // event_participants 테이블에는 major 필드가 없으므로 빈 문자열
      company: item.user_profiles?.company || '알 수 없음',
      position: item.user_profiles?.role || '알 수 없음',
      interests: '', // event_participants 테이블에는 interests 필드가 없으므로 빈 문자열
      event_id: item.event_id
    }))

    return formattedParticipants
  } catch (error) {
    console.error('Error in getEventParticipants:', error)
    return []
  }
}

export async function getFilteredAdminEvents(status: 'upcoming' | 'ongoing' | 'completed' | 'all'): Promise<AdminEvent[]> {
  const events = await getAdminEventsData()

  if (status === 'all') return events

  return events.filter(event => calculateEventStatus(event) === status)
}