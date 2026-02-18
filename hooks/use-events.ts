import { eventAPI, calculateEventStatus } from '@/lib/supabase/database'
import { Database } from '@/types/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']

export const useEvents = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 모든 이벤트 로드
  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const allEvents = await eventAPI.getAllEvents()
      setEvents(allEvents)
    } catch (err) {
      console.error('Error loading events:', err)
      setError('이벤트를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 특정 이벤트 로드
  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)

      const event = await eventAPI.getEvent(eventId)
      return event
    } catch (err) {
      console.error('Error loading event:', err)
      setError('이벤트를 불러오는데 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 코드로 이벤트 찾기
  const findEventByCode = async (eventCode: string) => {
    try {
      setLoading(true)
      setError(null)

      const event = await eventAPI.getEventByCode(eventCode)
      return event
    } catch (err) {
      console.error('Error finding event by code:', err)
      setError('이벤트를 찾는데 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 생성
  const createEvent = async (eventData: EventInsert) => {
    if (!user?.id) {
      throw new Error('사용자가 로그인되지 않았습니다.')
    }

    try {
      setLoading(true)
      setError(null)

      const newEvent = await eventAPI.createEvent({
        ...eventData,
        created_by: user.id
      })

      if (newEvent) {
        setEvents(prev => [newEvent, ...prev])
        return newEvent
      } else {
        throw new Error('이벤트 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('이벤트 생성에 실패했습니다.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 업데이트
  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      setLoading(true)
      setError(null)

      const updatedEvent = await eventAPI.updateEvent(eventId, updates)

      if (updatedEvent) {
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId ? updatedEvent : event
          )
        )
        return updatedEvent
      } else {
        throw new Error('이벤트 업데이트에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError('이벤트 업데이트에 실패했습니다.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 삭제
  const deleteEvent = async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)

      const success = await eventAPI.deleteEvent(eventId)

      if (success) {
        setEvents(prev => prev.filter(event => event.id !== eventId))
        return true
      } else {
        throw new Error('이벤트 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      setError('이벤트 삭제에 실패했습니다.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 상태별 필터링 (날짜 기준)
  const getEventsByStatus = (status: 'upcoming' | 'ongoing' | 'completed') => {
    return events.filter(event => calculateEventStatus(event) === status)
  }

  // 진행중인 이벤트
  const ongoingEvents = getEventsByStatus('ongoing')

  // 예정된 이벤트
  const upcomingEvents = getEventsByStatus('upcoming')

  // 종료된 이벤트
  const completedEvents = getEventsByStatus('completed')

  // 초기 로드
  useEffect(() => {
    loadEvents()
  }, [])

  return {
    events,
    ongoingEvents,
    upcomingEvents,
    completedEvents,
    loading,
    error,
    loadEvents,
    loadEvent,
    findEventByCode,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
