import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log('관리자 로그인 요청:', { username })

    if (!username || !password) {
      return NextResponse.json(
        { error: '사용자명과 비밀번호가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 관리자 계정 조회
    const { data: adminData, error: adminError } = await supabase
      .from('admin_accounts')
      .select('id, username, password_hash, full_name, role, role_id, is_active')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, adminData.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        adminId: adminData.id,
        username: adminData.username,
        role: adminData.role,
        role_id: adminData.role_id
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // 로그인 시간 업데이트
    await supabase
      .from('admin_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminData.id)

    console.log('✅ 관리자 로그인 성공:', {
      id: adminData.id,
      username: adminData.username,
      name: adminData.full_name
    })

    return NextResponse.json({
      success: true,
      message: '관리자로 로그인되었습니다.',
      token,
      admin: {
        id: adminData.id,
        username: adminData.username,
        name: adminData.full_name,
        role: adminData.role,
        role_id: adminData.role_id
      }
    })

  } catch (error) {
    console.error('❌ 관리자 로그인 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
