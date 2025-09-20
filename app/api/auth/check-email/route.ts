import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, isAdmin = false } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 서버 사이드에서 직접 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // auth.users 테이블에서 이메일 존재 여부 확인
    const { data: authUsers } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .limit(1)

    // user_profiles 테이블에서 이메일 존재 여부 확인
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('email, role, role_id')
      .eq('email', email)
      .single()

    // auth.users에는 있지만 user_profiles에 없는 경우 (SSO 가입 후 프로필 생성 실패)
    if (authUsers && authUsers.length > 0 && !existingProfile) {
      return NextResponse.json({
        isTaken: true,
        hasAuthRecord: true,
        hasProfile: false,
        message: '이미 가입된 이메일입니다. 로그인을 시도해주세요.'
      })
    }

    if (existingProfile) {
      // 관리자 회원가입인 경우 기존 사용자의 역할 확인
      if (isAdmin) {
        if (existingProfile.role === 'admin') {
          return NextResponse.json({
            isTaken: true,
            message: '이미 관리자로 가입된 이메일입니다.'
          })
        } else {
          // 일반 사용자이므로 관리자로 업그레이드 가능
          return NextResponse.json({
            isTaken: false,
            canUpgrade: true,
            message: '기존 사용자입니다. 관리자로 업그레이드할 수 있습니다.'
          })
        }
      } else {
        // 일반 회원가입인 경우
        return NextResponse.json({
          isTaken: true,
          message: '이미 가입된 이메일입니다.'
        })
      }
    }

    // 새 사용자인 경우
    return NextResponse.json({
      isTaken: false,
      canUpgrade: false,
      message: '사용 가능한 이메일입니다.'
    })

  } catch (error) {
    console.error('❌ 이메일 중복 확인 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
