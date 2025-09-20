import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 모든 사용자 삭제 시작...')

    // 서버 사이드에서 직접 Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 모든 Auth 사용자 조회
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('사용자 목록 조회 오류:', listError)
      return NextResponse.json(
        { error: '사용자 목록을 조회할 수 없습니다.', details: listError.message },
        { status: 500 }
      )
    }

    if (!authUsers.users || authUsers.users.length === 0) {
      return NextResponse.json({
        success: true,
        message: '삭제할 사용자가 없습니다.',
        deletedCount: 0
      })
    }

    console.log(`📋 총 ${authUsers.users.length}명의 사용자 발견`)

    // 모든 사용자 삭제
    const deletePromises = authUsers.users.map(async (user) => {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteError) {
          console.error(`사용자 ${user.email} 삭제 실패:`, deleteError)
          return { success: false, email: user.email, error: deleteError.message }
        } else {
          console.log(`✅ 사용자 ${user.email} 삭제 성공`)
          return { success: true, email: user.email }
        }
      } catch (error) {
        console.error(`사용자 ${user.email} 삭제 중 예외:`, error)
        return { success: false, email: user.email, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    const results = await Promise.all(deletePromises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`🎯 삭제 완료: 성공 ${successCount}명, 실패 ${failCount}명`)

    // user_profiles 테이블도 정리
    try {
      const { error: profileDeleteError } = await supabase
        .from('user_profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제

      if (profileDeleteError) {
        console.error('user_profiles 테이블 정리 실패:', profileDeleteError)
      } else {
        console.log('✅ user_profiles 테이블 정리 완료')
      }
    } catch (error) {
      console.error('user_profiles 테이블 정리 중 오류:', error)
    }

    // business_cards 테이블도 정리
    try {
      const { error: cardDeleteError } = await supabase
        .from('business_cards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제

      if (cardDeleteError) {
        console.error('business_cards 테이블 정리 실패:', cardDeleteError)
      } else {
        console.log('✅ business_cards 테이블 정리 완료')
      }
    } catch (error) {
      console.error('business_cards 테이블 정리 중 오류:', error)
    }

    return NextResponse.json({
      success: true,
      message: `모든 사용자 삭제 완료: 성공 ${successCount}명, 실패 ${failCount}명`,
      deletedCount: successCount,
      failedCount: failCount,
      results: results
    })

  } catch (error) {
    console.error('❌ 사용자 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
