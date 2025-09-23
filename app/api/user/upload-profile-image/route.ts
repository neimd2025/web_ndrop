import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성 (사용자 세션 기반)
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    // 파일 확장자 확인
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 허용)'
      }, { status: 400 })
    }

    // 파일 크기 확인 (5MB 제한)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: '파일 크기는 5MB를 초과할 수 없습니다.'
      }, { status: 400 })
    }

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'

    // 타임스탬프 생성 (YYYYMMDD-HHMMSS 형식)
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, -5) // YYYYMMDDTHHMMSS

    // 파일명 생성: {userID}-{timestamp}.{ext}
    const fileName = `${user.id}-${timestamp}.${fileExt}`
    const filePath = `profiles/users/${user.id}/${fileName}`

    console.log('📁 클라이언트 프로필 이미지 업로드:', {
      userId: user.id,
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    })

    // 기존 프로필 이미지 삭제 (선택사항)
    try {
      const { data: existingFiles } = await supabase.storage
        .from('images')
        .list(`profiles/users/${user.id}`)

      if (existingFiles && existingFiles.length > 0) {
        // 기존 파일들 삭제 (최대 5개까지만 유지)
        const filesToDelete = existingFiles
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(4) // 최신 1개를 제외한 나머지 삭제
          .map(file => `profiles/users/${user.id}/${file.name}`)

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('images')
            .remove(filesToDelete)

          console.log('🗑️ 기존 프로필 이미지 삭제:', filesToDelete)
        }
      }
    } catch (deleteError) {
      console.warn('기존 파일 삭제 중 오류 (무시):', deleteError)
    }

    // 파일 업로드
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // 중복 파일명 방지
      })

    if (uploadError) {
      console.error('이미지 업로드 오류:', uploadError)
      return NextResponse.json({
        error: '이미지 업로드 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    // 사용자 프로필에 이미지 URL 업데이트
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError)
      // 업로드는 성공했지만 DB 업데이트 실패 시에도 URL은 반환
    }

    console.log('✅ 클라이언트 프로필 이미지 업로드 완료:', publicUrl)

    return NextResponse.json({
      success: true,
      publicUrl,
      filePath,
      message: '프로필 이미지가 성공적으로 업로드되었습니다.'
    })

  } catch (error) {
    console.error('프로필 이미지 업로드 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
