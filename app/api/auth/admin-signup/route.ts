import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json()

    console.log('관리자 회원가입 요청:', { username, name })

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: '사용자명, 비밀번호, 이름이 모두 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자명 형식 검증 (영문, 숫자, 언더스코어만 허용)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: '사용자명은 영문, 숫자, 언더스코어만 사용 가능하며 3-20자여야 합니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 기존 사용자명 확인 (유효한 이메일로 검색)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('email, role_id')
      .eq('email', `${username}@example.com`)
      .single()

    if (existingProfile) {
      if (existingProfile.role_id === 2) {
        return NextResponse.json(
          { error: '이미 가입된 관리자 사용자명입니다. 로그인을 시도해주세요.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: '이미 가입된 사용자명입니다. 다른 사용자명을 사용하거나 기존 계정으로 로그인해주세요.' },
          { status: 400 }
        )
      }
    }

    // 관리자 계정 생성 (유효한 이메일 형식 사용)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@example.com`, // 유효한 이메일 형식 사용
      password,
      options: {
        data: {
          name: name,
          role_id: 2, // 관리자
          username: username // 실제 사용자명 저장
        }
      }
    })

    if (authError) {
      console.error('관리자 계정 생성 오류:', authError)
      return NextResponse.json(
        { error: '관리자 계정 생성에 실패했습니다.', details: authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      console.error('사용자 데이터가 생성되지 않았습니다.')
      return NextResponse.json(
        { error: '사용자 데이터를 생성할 수 없습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ Auth 사용자 생성 성공:', authData.user.id)

    // 관리자 이메일 인증은 일반 사용자와 동일하게 처리

    // 관리자 프로필 직접 생성
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: `${username}@example.com`, // 유효한 이메일 형식
          full_name: name,
          role_id: 2, // 관리자
          role: 'admin',
          contact: '',
          company: '',
          introduction: '',
          mbti: '',
          keywords: [],
          profile_image_url: null,
          qr_code_url: null
        })

      if (profileError) {
        console.error('관리자 프로필 생성 오류:', profileError)
        return NextResponse.json(
          { error: '관리자 프로필 생성에 실패했습니다.', details: profileError.message },
          { status: 500 }
        )
      }

      console.log('✅ 관리자 프로필 생성 성공')

    } catch (profileError) {
      console.error('프로필 생성 중 오류:', profileError)

      // Auth 사용자 삭제는 하지 않음 (일반 signUp이므로)

      return NextResponse.json(
        { error: '프로필 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 관리자 계정 생성 성공:', {
      userId: authData.user.id,
      username: username,
      name: name
    })

    return NextResponse.json({
      success: true,
      message: '관리자 계정이 성공적으로 생성되었습니다. 바로 로그인하실 수 있습니다.',
      user: {
        id: authData.user.id,
        username: username,
        name: name
      }
    })

  } catch (error) {
    console.error('❌ 관리자 회원가입 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
