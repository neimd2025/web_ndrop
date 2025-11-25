//@ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { calculateEventStatus } from './database'

export interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
  status: "upcoming" | "ongoing" | "completed"
  max_participants: number
  event_code: string
  created_at: string
}

export async function getEventsData(): Promise<Event[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events from server:', error)
      return []
    }

    // Add calculated status to each event
    const eventsWithStatus = (data || []).map(event => ({
      ...event,
      status: calculateEventStatus(event) as "upcoming" | "ongoing" | "completed"
    }))

    return eventsWithStatus
  } catch (error) {
    console.error('Error in getEventsData:', error)
    return []
  }
}

export async function getFilteredEvents(status: 'upcoming' | 'ongoing' | 'completed'): Promise<Event[]> {
  const events = await getEventsData()
  return events.filter(event => calculateEventStatus(event) === status)
}
