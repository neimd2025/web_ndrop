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
    const adminAccountId = decoded.adminId // admin_accounts의 ID

    // user_profiles에서 해당 관리자 찾기
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', `${decoded.username}@admin.local`)
      .single()

    const adminProfileId = adminProfile?.id || null

    // 이벤트 생성 (created_by에 관리자 ID 설정)
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
        organizer_kakao: '@neimed_official',
        created_by: adminProfileId, // 관리자 프로필 ID 설정 (없으면 null)
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
        organizer_kakao: '@neimed_official',
        created_by: adminProfileId,
        status: 'upcoming',
        current_participants: 0
      })
      return NextResponse.json({ error: `이벤트 생성 중 오류가 발생했습니다: ${eventError.message}` }, { status: 500 })
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
