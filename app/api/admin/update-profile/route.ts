import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      if (decoded.role_id !== 2) {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
      }
    } catch (jwtError) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, currentPassword, newPassword } = body

    if (!name) {
      return NextResponse.json({ error: '이름은 필수입니다.' }, { status: 400 })
    }

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // 현재 관리자 정보 조회
    const { data: adminData, error: adminError } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('id', decoded.id)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: '관리자 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 비밀번호 변경이 요청된 경우
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '현재 비밀번호를 입력해주세요.' }, { status: 400 })
      }

      // 현재 비밀번호 확인
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminData.password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 })
      }

      // 새 비밀번호 해시화
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // 비밀번호와 이름 업데이트
      const { error: updateError } = await supabase
        .from('admin_accounts')
        .update({
          full_name: name,
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', decoded.id)

      if (updateError) {
        console.error('관리자 프로필 업데이트 오류:', updateError)
        return NextResponse.json({ error: '프로필 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
      }
    } else {
      // 이름만 업데이트
      const { error: updateError } = await supabase
        .from('admin_accounts')
        .update({
          full_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', decoded.id)

      if (updateError) {
        console.error('관리자 프로필 업데이트 오류:', updateError)
        return NextResponse.json({ error: '프로필 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
      }
    }

    // user_profiles 테이블도 동기화 (관리자용 미러 엔트리)
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: name,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.id)

    if (profileUpdateError) {
      console.error('사용자 프로필 동기화 오류:', profileUpdateError)
      // 이 오류는 치명적이지 않으므로 로그만 남기고 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('관리자 프로필 업데이트 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
