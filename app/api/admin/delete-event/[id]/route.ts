import { createClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 이벤트 존재 여부 및 권한 확인
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({
        error: '이벤트를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 이벤트 생성자 확인 (자신이 생성한 이벤트만 삭제 가능)
    if (existingEvent.created_by !== decoded.adminId) {
      return NextResponse.json({
        error: '이 이벤트를 삭제할 권한이 없습니다.'
      }, { status: 403 })
    }

    // 관련 데이터 삭제 (참여자, 피드백, 알림 등)
    try {
      // 참여자 삭제
      await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', id)

      // 피드백 삭제
      await supabase
        .from('feedback')
        .delete()
        .eq('event_id', id)

      // 관련 알림 삭제
      await supabase
        .from('notifications')
        .delete()
        .eq('target_event_id', id)

      await supabase
        .from('notifications')
        .delete()
        .eq('related_event_id', id)

    } catch (relatedDataError) {
      console.error('관련 데이터 삭제 중 오류:', relatedDataError)
      // 관련 데이터 삭제 실패해도 이벤트 삭제는 계속 진행
    }

    // 이벤트 삭제
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('이벤트 삭제 오류:', deleteError)
      return NextResponse.json({
        error: '이벤트 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('이벤트 삭제 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
