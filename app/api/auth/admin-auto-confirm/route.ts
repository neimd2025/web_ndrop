import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🛠️ Admin auto-confirm API 호출 시작')

  try {
    // Content-Type 확인
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ 잘못된 Content-Type:', contentType)
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { userId } = body

    if (!userId) {
      console.error('❌ userId 누락')
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('관리자 이메일 자동 인증 시작:', userId)

    // 서비스 역할 키로 Supabase 클라이언트 생성
    const supabase = await createClient()

    // auth.users 테이블에서 해당 사용자의 이메일 인증 상태를 확인하고 업데이트
    // 사용자 생성 직후일 수 있으므로 재시도 로직 추가
    let userData = null
    let userError = null
    let userRetryCount = 0
    const maxUserRetries = 4 // 2초 (500ms * 4)

    while (userRetryCount < maxUserRetries) {
      const { data, error } = await supabase.auth.admin.getUserById(userId)

      if (data?.user) {
        userData = data
        userError = null
        break
      } else {
        userError = error
        userRetryCount++
        if (userRetryCount < maxUserRetries) {
          console.log(`사용자 대기 중... (${userRetryCount}/${maxUserRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    if (!userData?.user) {
      console.error('사용자 조회 실패:', userError)
      return NextResponse.json({ error: '사용자 조회 실패', details: userError }, { status: 500 })
    }

    // 이미 이메일이 인증된 경우
    if (userData.user.email_confirmed_at) {
      console.log('이미 이메일 인증 완료:', userData.user.email)
      return NextResponse.json({
        success: true,
        message: '이미 이메일 인증이 완료된 계정입니다.',
        confirmed: true
      })
    }

    // 프로필이 생성될 때까지 최대 3초 대기 (재시도 로직)
    let profileData = null
    let profileError = null
    let retryCount = 0
    const maxRetries = 6 // 3초 (500ms * 6)

    while (retryCount < maxRetries) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id, email')
        .eq('id', userId)
        .single()

      if (data) {
        profileData = data
        profileError = null
        break
      } else {
        profileError = error
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`프로필 대기 중... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    if (!profileData) {
      console.log('프로필이 없음. 프로필 생성 시도 중...')

      // 프로필이 없으면 생성 시도
      try {
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/create-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            email: userData.user.email,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || '관리자',
            roleId: 2 // 관리자
          })
        })

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json()
          console.log('✅ 프로필 생성 성공:', profileResult)

          // 프로필 생성 후 다시 조회
          const { data: newProfileData } = await supabase
            .from('user_profiles')
            .select('role_id, email')
            .eq('id', userId)
            .single()

          profileData = newProfileData
        } else {
          console.error('❌ 프로필 생성 실패:', await profileResponse.text())
          return NextResponse.json({
            error: '프로필 생성에 실패했습니다.',
            details: '관리자 프로필을 생성할 수 없습니다.'
          }, { status: 500 })
        }
      } catch (createError) {
        console.error('❌ 프로필 생성 중 오류:', createError)
        return NextResponse.json({
          error: '프로필 생성 중 오류가 발생했습니다.',
          details: createError instanceof Error ? createError.message : 'Unknown error'
        }, { status: 500 })
      }

      if (!profileData) {
        console.error('프로필 생성 후에도 조회 실패')
        return NextResponse.json({
          error: '프로필 생성 후 조회에 실패했습니다.',
          details: '관리자 프로필을 생성했지만 조회할 수 없습니다.'
        }, { status: 500 })
      }
    }

    // 관리자가 아닌 경우 인증 생략 거부
    if (profileData.role_id !== 2) {
      console.log('관리자가 아닌 사용자의 자동 인증 시도 차단:', profileData.email)
      return NextResponse.json({
        error: '관리자 계정만 자동 인증이 가능합니다'
      }, { status: 403 })
    }

    // 관리자 계정의 이메일 자동 인증 처리
    const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true
      }
    )

    if (confirmError) {
      console.error('이메일 인증 처리 오류:', confirmError)
      return NextResponse.json({
        error: '이메일 인증 처리 실패',
        details: confirmError
      }, { status: 500 })
    }

    console.log('✅ 관리자 이메일 자동 인증 완료:', profileData.email)

    return NextResponse.json({
      success: true,
      message: '관리자 계정의 이메일 인증이 자동으로 완료되었습니다.',
      confirmed: true,
      user: confirmData.user
    })

  } catch (error) {
    console.error('❌ 관리자 자동 인증 API 오류:', error)

    // 구체적인 에러 타입에 따른 대응
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'Invalid JSON format',
        details: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      error: '서버 오류',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
