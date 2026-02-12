
import { createAdminClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = request.headers.get('authorization')
    
    // Admin Client가 헤더에 없을 경우, 쿠키에서도 확인 시도 (선택적)
    // 하지만 AdminNotificationsClient는 보통 localStorage의 토큰을 헤더에 담아 보냄.
    
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

    const body = await request.json()
    const { title, message, target_type, target_event_id, target_ids } = body

    if (!title || !message || !target_type) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = await createAdminClient()
    
    let notificationsToInsert: any[] = []
    
    if (target_type === 'all') {
      // 전체 알림: 1개 생성
      notificationsToInsert.push({
        title,
        message,
        target_type: 'all',
        target_event_id: null,
        user_id: null,
        sent_by: decoded.id || null, // 관리자 ID 기록 (있다면)
        notification_type: 'system', // 기본값
        sent_date: new Date().toISOString(),
        delivered_count: 0,
        read_count: 0,
        status: 'sent'
      })
    } else if (target_type === 'specific') {
      // 특정 사용자 알림: target_ids 배열 처리
      if (!target_ids || !Array.isArray(target_ids) || target_ids.length === 0) {
        return NextResponse.json({ error: '대상 사용자가 지정되지 않았습니다.' }, { status: 400 })
      }
      
      notificationsToInsert = target_ids.map((userId: string) => ({
        title,
        message,
        target_type: 'specific',
        target_event_id: null,
        user_id: userId,
        sent_by: decoded.id || null,
        notification_type: 'system',
        sent_date: new Date().toISOString(),
        delivered_count: 0,
        read_count: 0,
        status: 'sent'
      }))
    } else if (target_type === 'event_participants') {
      // 이벤트 참가자 알림: 참가자 조회 후 개별 알림 생성 (Realtime 호환성 위해)
      if (!target_event_id) {
         return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 })
      }
      
      const { data: participants, error: participantError } = await supabase
        .from('event_participants')
        .select('user_id')
        .eq('event_id', target_event_id)
        .eq('status', 'confirmed')

      if (participantError) {
        console.error('참가자 목록 가져오기 오류:', participantError)
        return NextResponse.json({ error: '참가자 목록을 가져오는데 실패했습니다.' }, { status: 500 })
      }

      const participantIds = (participants as any[])?.map((p: any) => p.user_id) || []
      
      if (participantIds.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: '참가자가 없어 알림을 보내지 않았습니다.', 
          notifications: [],
          targetCount: 0 
        })
      }

      notificationsToInsert = participantIds.map((userId: string) => ({
        title,
        message,
        target_type: 'specific', // specific으로 변환하여 개별 전송
        target_event_id: target_event_id,
        user_id: userId,
        sent_by: decoded.id || null,
        notification_type: 'system',
        sent_date: new Date().toISOString(),
        delivered_count: 0,
        read_count: 0,
        status: 'sent'
      }))
    } else {
        return NextResponse.json({ error: '지원하지 않는 알림 대상입니다.' }, { status: 400 })
    }

    // 알림 일괄 삽입
    if (notificationsToInsert.length > 0) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notificationsToInsert as any)
            .select()

        if (error) {
            console.error('알림 생성 오류:', error)
            return NextResponse.json({ error: '알림 저장에 실패했습니다.' }, { status: 500 })
        }
        
        return NextResponse.json({
            success: true,
            notifications: data,
            message: '알림이 성공적으로 전송되었습니다.',
            targetCount: notificationsToInsert.length
        })
    }
    
    return NextResponse.json({ success: true, notifications: [], targetCount: 0 })

  } catch (error) {
    console.error('알림 전송 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
