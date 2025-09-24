import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventCode, eventId, userId } = body

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    if (!eventCode && !eventId) {
      return NextResponse.json({ error: '이벤트 코드 또는 이벤트 ID가 필요합니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    let event
    let eventError

    if (eventId) {
      // 이벤트 ID로 이벤트 찾기
      const result = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      event = result.data
      eventError = result.error
    } else {
      // 이벤트 코드로 이벤트 찾기
      const result = await supabase
        .from('events')
        .select('*')
        .eq('event_code', eventCode.toUpperCase())
        .single()
      event = result.data
      eventError = result.error
    }

    if (eventError || !event) {
      return NextResponse.json({ error: '유효하지 않은 이벤트입니다.' }, { status: 404 })
    }

    // 이미 참가했는지 확인
    const { data: existingParticipant } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: '이미 참가한 이벤트입니다.' }, { status: 400 })
    }

    // 이벤트 참가
    const { data: participant, error: joinError } = await supabase
      .from('event_participants')
      .insert({
        event_id: event.id,
        user_id: userId,
        status: 'confirmed',
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (joinError) {
      console.error('이벤트 참가 오류:', joinError)
      return NextResponse.json({ error: '이벤트 참가 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 이벤트 참가자 수 업데이트
    const currentParticipants = event.current_participants || 0
    const { error: updateError } = await supabase
      .from('events')
      .update({
        current_participants: currentParticipants + 1
      })
      .eq('id', event.id)

    if (updateError) {
      console.error('참가자 수 업데이트 오류:', updateError)
      // 참가자 수 업데이트 실패해도 참가는 성공으로 처리
    } else {
      console.log('참가자 수 업데이트 성공:', currentParticipants + 1)
    }

    // 이벤트 참가 알림 생성
    console.log('이벤트 참가 알림 생성 시작:', {
      userId,
      eventId: event.id,
      eventTitle: event.title
    })

    try {
      const notificationData = {
        title: '이벤트 참가',
        message: `${event.title}에 참가했습니다`,
        target_type: 'specific',
        user_id: userId,
        target_event_id: event.id,
        notification_type: 'event_joined',
        metadata: {
          event_title: event.title,
          action: 'joined'
        }
      }

      console.log('알림 데이터:', notificationData)

      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (notificationError) {
        console.error('이벤트 참가 알림 생성 오류:', notificationError)
        // 알림 생성 실패해도 참가는 성공으로 처리
      } else {
        console.log('✅ 이벤트 참가 알림 생성 성공:', notification)
      }
    } catch (notificationError) {
      console.error('이벤트 참가 알림 생성 오류:', notificationError)
      // 알림 생성 실패해도 참가는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      participant,
      event,
      message: '이벤트에 성공적으로 참가했습니다!'
    })

  } catch (error) {
    console.error('이벤트 참가 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
