import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 저장된 명함이 사용자의 것인지 확인
    const { data: savedCard, error: checkError } = await supabase
      .from('collected_cards')
      .select('id, collector_id')
      .eq('id', id)
      .eq('collector_id', user.id)
      .single()

    if (checkError || !savedCard) {
      return NextResponse.json({ error: '명함을 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 })
    }

    // 명함 삭제
    const { error: deleteError } = await supabase
      .from('collected_cards')
      .delete()
      .eq('id', id)
      .eq('collector_id', user.id)

    if (deleteError) {
      console.error('명함 삭제 오류:', deleteError)
      return NextResponse.json({ error: '명함 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '명함이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('명함 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()
    const { is_favorite } = body

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 저장된 명함이 사용자의 것인지 확인
    const { data: savedCard, error: checkError } = await supabase
      .from('collected_cards')
      .select('id, collector_id')
      .eq('id', id)
      .eq('collector_id', user.id)
      .single()

    if (checkError || !savedCard) {
      return NextResponse.json({ error: '명함을 찾을 수 없거나 수정 권한이 없습니다.' }, { status: 404 })
    }

    // 즐겨찾기 상태 업데이트
    const { error: updateError } = await supabase
      .from('collected_cards')
      .update({ is_favorite })
      .eq('id', id)
      .eq('collector_id', user.id)

    if (updateError) {
      console.error('즐겨찾기 상태 업데이트 오류:', updateError)
      return NextResponse.json({ error: '즐겨찾기 상태 변경에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '즐겨찾기 상태가 변경되었습니다.'
    })

  } catch (error) {
    console.error('즐겨찾기 상태 업데이트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
