import { createClient, createAdminClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      if (decoded.role_id !== 2) {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
      }
    } catch (jwtError) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    const { eventId, title, message } = await request.json()

    if (!eventId || !title || !message) {
      return NextResponse.json({ error: '이벤트 ID, 제목, 메시지가 모두 필요합니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = await createAdminClient()

    // 해당 이벤트의 참가자 목록 가져오기
    const { data: participants, error: participantError } = await supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (participantError) {
      console.error('참가자 목록 가져오기 오류:', participantError)
      return NextResponse.json({ error: '참가자 목록을 가져오는데 실패했습니다.' }, { status: 500 })
    }

    const targetIds = (participants as any[])?.map((p: any) => p.user_id) || []

    // 각 참가자에게 개별 알림 생성 (실제 스키마에 맞춤)
    const notifications = targetIds.map(userId => ({
      title,
      message,
      target_type: 'specific',
      target_event_id: eventId,
      user_id: userId,
      sent_by: null // 관리자 계정은 auth.users에 없으므로 null로 설정
      // id, created_at은 자동 생성됨
    }))

    const { data: createdNotifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications as any)
      .select()

    if (notificationError) {
      console.error('알림 생성 오류:', notificationError)
      return NextResponse.json({ error: '알림 전송에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notifications: createdNotifications,
      message: '공지가 성공적으로 전송되었습니다.',
      targetCount: targetIds.length
    })

  } catch (error) {
    console.error('공지 전송 API 오류:', error)
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
