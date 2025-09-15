import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, method = 'check' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 서버 사이드에서 직접 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 이메일 존재 여부 확인
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role, role_id')
      .eq('email', email)
      .single()

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('사용자 조회 오류:', userError)
      return NextResponse.json(
        { error: '사용자 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // method가 check인 경우 상태만 반환
    if (method === 'check') {
      if (!existingUser) {
        return NextResponse.json({
          status: 'new_admin',
          message: '새로운 관리자 계정을 생성할 수 있습니다.',
          canCreate: true
        })
      }

      if (existingUser.role === 'admin') {
        return NextResponse.json({
          status: 'already_admin',
          message: '이미 관리자 계정입니다.',
          canCreate: false
        })
      }

      return NextResponse.json({
        status: 'can_upgrade',
        message: '기존 계정을 관리자로 업그레이드할 수 있습니다.',
        canUpgrade: true
      })
    }

    // method가 upgrade인 경우 실제 업그레이드 실행
    if (method === 'upgrade' && existingUser && existingUser.role !== 'admin') {
      // 관리자 역할 ID 가져오기
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single()

      if (!adminRole) {
        return NextResponse.json(
          { error: '관리자 역할이 설정되지 않았습니다.' },
          { status: 500 }
        )
      }

      // 프로필을 관리자로 업데이트
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'admin',
          role_id: adminRole.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('프로필 업데이트 오류:', updateError)
        return NextResponse.json(
          { error: '관리자 권한 부여 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      // Auth 사용자 메타데이터도 업데이트
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            isAdmin: true
          }
        }
      )

      if (metadataError) {
        console.error('메타데이터 업데이트 오류:', metadataError)
        // 메타데이터 업데이트 실패는 중요하지 않으므로 계속 진행
      }

      return NextResponse.json({
        success: true,
        message: '성공적으로 관리자로 업그레이드되었습니다.'
      })
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ 관리자 업그레이드 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}