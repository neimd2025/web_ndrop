import { createClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // JWT 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { id } = await params

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
      start_date,
      end_date,
      location,
      max_participants,
      image_url,
      organizer_name,
      organizer_email,
      organizer_phone,
      organizer_kakao,
      overview_points,
      target_audience,
      special_benefits,
      is_public,
    } = body

    // 필수 필드 검증
    if (!title || !start_date || !end_date) {
      return NextResponse.json({
        error: '제목, 시작일, 종료일은 필수입니다.'
      }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 이벤트 존재 여부 및 권한 확인
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      console.error('이벤트 조회 오류:', fetchError)
      return NextResponse.json({
        error: '이벤트를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    console.log('이벤트 수정 권한 확인:', {
      eventId: id,
      eventAdminCreatedBy: existingEvent.admin_created_by,
      currentAdminId: decoded.adminId,
      isAuthorized: existingEvent.admin_created_by === decoded.adminId
    })

    // 이벤트 생성자 확인 (자신이 생성한 이벤트만 수정 가능)
    if (existingEvent.admin_created_by !== decoded.adminId) {
      console.error('권한 없음:', {
        eventAdminCreatedBy: existingEvent.admin_created_by,
        currentAdminId: decoded.adminId
      })
      return NextResponse.json({
        error: '이 이벤트를 수정할 권한이 없습니다.'
      }, { status: 403 })
    }

    // 날짜 유효성 검증
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (startDate >= endDate) {
      return NextResponse.json({
        error: '종료일은 시작일보다 늦어야 합니다.'
      }, { status: 400 })
    }

    // 이벤트 업데이트
    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      start_date: start_date,
      end_date: end_date,
      location: location?.trim() || null,
      max_participants: max_participants || 100,
      image_url: image_url || null,
      organizer_name: organizer_name?.trim() || 'ndrop 팀',
      organizer_email: organizer_email?.trim() || 'support@ndrop.com',
      organizer_phone: organizer_phone?.trim() || '02-1234-5678',
      organizer_kakao: organizer_kakao?.trim() || '@ndrop_official',
      overview_points: overview_points || null,
      target_audience: target_audience || null,
      special_benefits: special_benefits || null,
      updated_at: new Date().toISOString(),
      is_public: is_public || false,
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('이벤트 업데이트 오류:', updateError)
      return NextResponse.json({
        error: '이벤트 업데이트 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 수정되었습니다.',
      event: updatedEvent
    })

  } catch (error) {
    console.error('이벤트 수정 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
