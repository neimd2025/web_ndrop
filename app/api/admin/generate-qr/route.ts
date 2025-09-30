import { getSiteUrl } from '@/lib/utils'
import { createClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

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

    // 이벤트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('이벤트 조회 오류:', eventError)
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // QR 코드 생성 (이벤트 코드를 직접 사용)
    const qrDataUrl = await QRCode.toDataURL(event.event_code, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      qr: {
        url: `${getSiteUrl()}/client/events/scan`, // QR 스캔 페이지 URL
        dataUrl: qrDataUrl,
        eventCode: event.event_code,
        eventTitle: event.title,
        eventDate: event.start_date
      },
      message: 'QR 코드가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('QR 코드 생성 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
