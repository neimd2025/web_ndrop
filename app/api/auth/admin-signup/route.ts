import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    console.log('관리자 회원가입 요청:', { email, name })

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름이 모두 필요합니다.' },
        { status: 400 }
      )
    }

    // 서버 사이드에서 직접 Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Auth 사용자 중복 확인
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers.users.find(user => user.email === email)

    if (existingAuthUser) {
      // user_profiles에서 역할 확인
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('role_id, role')
        .eq('id', existingAuthUser.id)
        .single()

      if (existingProfile) {
        if (existingProfile.role_id === 2) {
          return NextResponse.json(
            { error: '이미 가입된 관리자 이메일입니다. 로그인을 시도해주세요.' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: '이미 가입된 사용자 이메일입니다. 다른 이메일을 사용하거나 기존 계정으로 로그인해주세요.' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다. 로그인을 시도해주세요.' },
          { status: 400 }
        )
      }
    }

    // 관리자 계정 생성 (이메일 인증 없이)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증을 자동으로 완료
      user_metadata: {
        name: name,
        role_id: 2 // 관리자
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

    // 기존 create-profile API를 사용하여 프로필 생성
    try {
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authData.user.id,
          email: email,
          name: name,
          roleId: 2 // 관리자
        })
      })

      if (!profileResponse.ok) {
        const profileError = await profileResponse.text()
        console.error('프로필 생성 실패:', profileError)

        // Auth 사용자 삭제
        await supabase.auth.admin.deleteUser(authData.user.id)

        return NextResponse.json(
          { error: '프로필 생성에 실패했습니다.', details: profileError },
          { status: 500 }
        )
      }

      const profileResult = await profileResponse.json()
      console.log('✅ 프로필 생성 성공:', profileResult)

    } catch (profileError) {
      console.error('프로필 생성 중 오류:', profileError)

      // Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: '프로필 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 관리자 계정 생성 성공:', {
      userId: authData.user.id,
      email: email,
      name: name
    })

    return NextResponse.json({
      success: true,
      message: '관리자 계정이 성공적으로 생성되었습니다.',
      user: {
        id: authData.user.id,
        email: email,
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
