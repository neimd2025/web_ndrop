import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth 로그인 후 누락된 프로필을 복구하는 API
 * auth.users에는 있지만 user_profiles에 없는 사용자들을 찾아서 프로필을 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // auth.users에서 모든 사용자 가져오기
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, user_metadata, created_at')

    if (authError) {
      console.error('auth.users 조회 오류:', authError)
      return NextResponse.json(
        { error: 'auth.users 테이블 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // user_profiles에서 모든 프로필 가져오기
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')

    if (profileError) {
      console.error('user_profiles 조회 오류:', profileError)
      return NextResponse.json(
        { error: 'user_profiles 테이블 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 프로필이 없는 사용자들 찾기
    const profileIds = new Set(profiles?.map(p => p.id) || [])
    const missingProfiles = authUsers?.filter(user => !profileIds.has(user.id)) || []

    console.log(`누락된 프로필 ${missingProfiles.length}개 발견`)

    const results = []

    // 누락된 프로필들을 생성
    for (const user of missingProfiles) {
      try {
        const fullName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        '사용자'

        // user_profiles 생성
        const { error: profileInsertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            nickname: fullName,
            role: 'user',
            role_id: 1, // 일반 사용자 role_id
            company: '',
            contact: '',
            introduction: '',
            mbti: '',
            keywords: [],
            profile_image_url: user.user_metadata?.avatar_url || null,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          })

        if (profileInsertError) {
          console.error(`프로필 생성 실패 (${user.email}):`, profileInsertError)
          results.push({
            email: user.email,
            success: false,
            error: profileInsertError.message
          })
          continue
        }

        // business_cards 생성
        const { error: cardInsertError } = await supabase
          .from('business_cards')
          .insert({
            user_id: user.id,
            full_name: fullName,
            email: user.email,
            company: '',
            role: '',
            contact: '',
            introduction: '',
            profile_image_url: user.user_metadata?.avatar_url || null,
            is_public: true,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          })

        if (cardInsertError) {
          console.error(`명함 생성 실패 (${user.email}):`, cardInsertError)
          // 명함 생성 실패는 중요하지 않으므로 계속 진행
        }

        results.push({
          email: user.email,
          success: true,
          profileCreated: true,
          businessCardCreated: !cardInsertError
        })

        console.log(`✅ 프로필 복구 완료: ${user.email}`)

      } catch (error) {
        console.error(`프로필 복구 실패 (${user.email}):`, error)
        results.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalMissing: missingProfiles.length,
      repaired: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })

  } catch (error) {
    console.error('❌ 프로필 복구 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}