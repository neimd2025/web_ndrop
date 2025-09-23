import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.'
    })

    // 쿠키 삭제
    response.cookies.delete('admin_token')
    response.cookies.delete('admin_user')

    return response

  } catch (error) {
    console.error('로그아웃 오류:', error)
    return NextResponse.json({
      error: '로그아웃 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
