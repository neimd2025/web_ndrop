import { createClient } from '@/utils/supabase/server'
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

    const body = await request.json()
    const {
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      maxParticipants,
      imageUrl,
      adminId,
      adminName,
      adminUsername,
      overviewPoints,
      targetAudience,
      specialBenefits
    } = body

    if (!title || !description || !startDate || !startTime || !endDate || !endTime || !location || !maxParticipants) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 이벤트 코드 자동 생성
    const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 한국 시간으로 저장 (명시적으로 한국 시간대 설정)
    const startDateTime = new Date(`${startDate}T${startTime}:00+09:00`).toISOString()
    const endDateTime = new Date(`${endDate}T${endTime}:00+09:00`).toISOString()

    // JWT 토큰에서 관리자 ID 가져오기
    const adminAccountId = decoded.adminId // admin_accounts의 ID (user_profiles에도 동일한 ID로 저장됨)

    // 이벤트 생성 (관리자 ID를 created_by에 저장)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title,
        description,
        start_date: startDateTime,
        end_date: endDateTime,
        location,
        max_participants: parseInt(maxParticipants),
        event_code: eventCode,
        image_url: imageUrl,
        organizer_name: adminName || decoded.username || '관리자',
        organizer_email: `${decoded.username}@admin.local`,
        organizer_phone: '02-1234-5678',
        organizer_kakao: '@ndrop_official',
        created_by: null, // 일반 사용자가 생성한 이벤트가 아니므로 null
        admin_created_by: adminAccountId, // 생성한 관리자 ID로 설정
        status: 'upcoming',
        current_participants: 0,
        // 새로운 필드들
        overview_points: overviewPoints || [],
        target_audience: targetAudience || [],
        special_benefits: specialBenefits || []
      })
      .select()
      .single()

    if (eventError) {
      console.error('이벤트 생성 오류:', eventError)
      console.error('이벤트 생성 데이터:', {
        title,
        description,
        start_date: startDateTime,
        end_date: endDateTime,
        location,
        max_participants: parseInt(maxParticipants),
        event_code: eventCode,
        image_url: imageUrl,
        organizer_name: adminName || decoded.username || '관리자',
        organizer_email: `${decoded.username}@admin.local`,
        organizer_phone: '02-1234-5678',
        organizer_kakao: '@ndrop_official',
        created_by: null,
        status: 'upcoming',
        current_participants: 0
      })
      return NextResponse.json({ error: `이벤트 생성 중 오류가 발생했습니다: ${eventError.message}` }, { status: 500 })
    }

    // 새로운 이벤트 알림을 모든 사용자에게 전송
    try {
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(100) // 성능을 위해 최대 100명에게만 전송

      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(user => ({
          title: '새로운 네트워킹 이벤트',
          message: `${event.title}이 ${new Date(event.start_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}에 열립니다. 지금 참가신청하세요!`,
          notification_type: 'event_created',
          target_type: 'specific',
          user_id: user.id,
          related_event_id: event.id,
          metadata: {
            event_title: event.title,
            event_date: new Date(event.start_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
            action: 'created'
          },
          sent_by: null
        }))

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.error('새 이벤트 알림 생성 오류:', notificationError)
          // 알림 생성 실패해도 이벤트 생성은 성공으로 처리
        } else {
          console.log(`${allUsers.length}명에게 새 이벤트 알림 전송 완료`)
        }
      }
    } catch (notificationError) {
      console.error('새 이벤트 알림 생성 오류:', notificationError)
      // 알림 생성 실패해도 이벤트 생성은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      event,
      message: '이벤트가 성공적으로 생성되었습니다!'
    })

  } catch (error) {
    console.error('이벤트 생성 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
