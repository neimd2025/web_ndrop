import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      message,
      notification_type,
      target_user_id,
      metadata = {},
      related_user_id,
      related_business_card_id,
      related_event_id
    } = body

    // 필수 필드 검증
    if (!title || !message || !notification_type) {
      return NextResponse.json({
        error: '제목, 메시지, 알림 타입은 필수입니다.'
      }, { status: 400 })
    }

    // 알림 생성
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        target_type: target_user_id ? 'specific' : 'all',
        user_id: target_user_id || null,
        target_event_id: related_event_id || null,
        notification_type,
        metadata: {},
        sent_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('알림 생성 오류:', error)
      return NextResponse.json({
        error: '알림 생성에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('알림 생성 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
