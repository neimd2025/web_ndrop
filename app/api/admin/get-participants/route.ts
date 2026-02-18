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

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 이벤트 참여자 조회
    const { data: participants, error: participantError } = await supabase
      .from('event_participants')
      .select(`
        *,
        user_profiles!event_participants_user_profiles_fkey(
          full_name,
          email,
          company,
          job_title,
          work_field,
          affiliation_type,
          contact,
          profile_image_url
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (participantError) {
      console.error('참여자 조회 오류:', participantError)
      return NextResponse.json({ error: '참여자 조회에 실패했습니다.' }, { status: 500 })
    }

    // 데이터 형식 변환
    const formattedParticipants = (participants || []).map((item: any) => {
      const profile = item.user_profiles || {}
      const affiliationType = profile.affiliation_type

      // 소속/미소속에 따라 "하는 일" 텍스트 분기
      let position = ''
      if (affiliationType === '소속') {
        position = profile.job_title || ''
      } else {
        position = profile.work_field || ''
      }

      return {
        id: item.id,
        name: profile.full_name || '알 수 없음',
        email: profile.email || '알 수 없음',
        phone: profile.contact || '',
        company: profile.company || '',
        position,
        profile_image_url: profile.profile_image_url || null,
        event_id: item.event_id,
        status: item.status,
        created_at: item.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      participants: formattedParticipants
    })

  } catch (error) {
    console.error('참여자 조회 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
