import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 클라이언트용 이벤트 목록 가져오기 (모든 이벤트 표시)
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('이벤트 목록 조회 오류:', error)
      return NextResponse.json({ error: '이벤트 목록을 가져오는데 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      message: '이벤트 목록을 성공적으로 가져왔습니다.'
    })

  } catch (error) {
    console.error('이벤트 목록 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
