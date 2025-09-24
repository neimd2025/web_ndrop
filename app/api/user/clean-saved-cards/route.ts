import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 자신의 명함이 저장된 경우 삭제
    const { data: businessCards, error: businessCardsError } = await supabase
      .from('business_cards')
      .select('id')
      .eq('user_id', user.id)

    if (businessCardsError) {
      console.error('자신의 명함 조회 오류:', businessCardsError)
      return NextResponse.json({ error: '명함 조회에 실패했습니다.' }, { status: 500 })
    }

    if (businessCards && businessCards.length > 0) {
      const myCardIds = businessCards.map(card => card.id)

      // 자신의 명함이 저장된 경우 삭제
      const { error: deleteError } = await supabase
        .from('collected_cards')
        .delete()
        .eq('collector_id', user.id)
        .in('card_id', myCardIds)

      if (deleteError) {
        console.error('잘못된 명함 삭제 오류:', deleteError)
        return NextResponse.json({ error: '명함 삭제에 실패했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: '자신의 명함이 저장된 명함 목록에서 제거되었습니다.'
    })

  } catch (error) {
    console.error('명함 정리 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
