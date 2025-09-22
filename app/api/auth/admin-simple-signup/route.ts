import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
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

    // 기존 사용자명 확인
    const { data: existingAdmin } = await supabase
      .from('admin_accounts')
      .select('username')
      .eq('username', username)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: '이미 가입된 관리자 사용자명입니다. 로그인을 시도해주세요.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 관리자 계정 생성 (Supabase Auth 없이)
    const { data: adminData, error: adminError } = await supabase
      .from('admin_accounts')
      .insert({
        username,
        password_hash: hashedPassword,
        full_name: name,
        role: 'admin',
        role_id: 2, // 관리자 role_id
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (adminError) {
      console.error('관리자 계정 생성 오류:', adminError)
      return NextResponse.json(
        { error: '관리자 계정 생성에 실패했습니다.', details: adminError.message },
        { status: 500 }
      )
    }

    // 기존 시스템과 호환을 위해 user_profiles에도 생성
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: adminData.id, // admin_accounts와 동일한 ID 사용
        email: `${username}@admin.local`, // 관리자 식별용 이메일
        full_name: name,
        role_id: 2, // 관리자 role_id
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
      // admin_accounts는 이미 생성되었으므로 롤백
      await supabase.from('admin_accounts').delete().eq('id', adminData.id)
      return NextResponse.json(
        { error: '관리자 프로필 생성에 실패했습니다.', details: profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ 관리자 계정 생성 성공:', {
      id: adminData.id,
      username: adminData.username,
      name: adminData.full_name
    })

    return NextResponse.json({
      success: true,
      message: '관리자 계정이 성공적으로 생성되었습니다. 바로 로그인하실 수 있습니다.',
      admin: {
        id: adminData.id,
        username: adminData.username,
        name: adminData.full_name
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
