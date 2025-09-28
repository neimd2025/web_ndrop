import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 사용자 프로필 정보 가져오기
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('사용자 프로필 가져오기 오류:', profileError)
    }

    // 저장된 명함 데이터 가져오기
    const { data: savedCards, error } = await supabase
      .from('collected_cards')
      .select(`
        *,
        business_card:business_cards(*)
      `)
      .eq('collector_id', user.id)
      .not('business_cards.user_id', 'eq', user.id)
      .order('collected_at', { ascending: false })

    if (error) {
      console.error('저장된 명함 데이터 가져오기 오류:', error)
      return NextResponse.json({ error: '저장된 명함 데이터를 불러올 수 없습니다.' }, { status: 500 })
    }

    // 사용자 프로필 데이터와 명함 데이터를 병합
    const enrichedUser = userProfile ? { ...user, ...userProfile } : user

    return NextResponse.json({
      success: true,
      user: enrichedUser,
      savedCards: savedCards || []
    })

  } catch (error) {
    console.error('저장된 명함 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
