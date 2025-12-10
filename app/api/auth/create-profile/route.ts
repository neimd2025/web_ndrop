import { ROLE_IDS, ROLE_NAMES, isAdminEmail } from '@/lib/constants'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, roleId } = await request.json()

    console.log('API 호출됨:', { userId, email, name, roleId })

    // 환경 변수 확인
    console.log('환경 변수 확인:')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SERVICE_ROLE_KEY 존재:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

            let supabase
    try {
      supabase = await createClient()
      console.log('Supabase 클라이언트 생성됨')
    } catch (error) {
      console.error('Supabase 클라이언트 생성 오류:', error)
      return NextResponse.json({
        error: 'Supabase 클라이언트 생성 실패',
        details: error
      }, { status: 500 })
    }

    // roleId에 따라 역할 결정
    const finalRoleId = roleId || (isAdminEmail(email) ? ROLE_IDS.ADMIN : ROLE_IDS.USER)
    const userRole = finalRoleId === ROLE_IDS.ADMIN ? ROLE_NAMES.ADMIN : ROLE_NAMES.USER

    // 사용자 프로필 생성
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: name || '',
        email: email,
        contact: '',
        company: '',
        role: userRole,
        role_id: finalRoleId,
        work_field: null,
        introduction: '',
        mbti: '',
        keywords: [],
        profile_image_url: null,
        qr_code_url: null
      })

    if (profileError) {
      console.error('프로필 생성 오류:', profileError)
      return NextResponse.json({ error: '프로필 생성 실패', details: profileError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: finalRoleId === ROLE_IDS.ADMIN ? '관리자 프로필이 생성되었습니다.' : '프로필이 생성되었습니다.',
      role: userRole
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 })
  }
}
