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

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
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
      adminUsername
    } = body

    if (!title || !description || !startDate || !startTime || !endDate || !endTime || !location || !maxParticipants) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 이벤트 코드 자동 생성
    const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 한국 시간으로 저장 (UTC 변환 없이)
    const startDateTime = `${startDate}T${startTime}:00+09:00`
    const endDateTime = `${endDate}T${endTime}:00+09:00`

    // 이벤트 생성 (created_by는 null로 설정하여 외래 키 제약 조건 우회)
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
        organizer_name: adminName || adminUsername || '관리자',
        organizer_email: `${adminUsername}@admin.local`,
        organizer_phone: '02-1234-5678',
        organizer_kakao: '@neimed_official',
        created_by: null, // 관리자 계정은 auth.users에 없으므로 null로 설정
        status: 'upcoming',
        current_participants: 0
      })
      .select()
      .single()

    if (eventError) {
      console.error('이벤트 생성 오류:', eventError)
      return NextResponse.json({ error: '이벤트 생성 중 오류가 발생했습니다.' }, { status: 500 })
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
