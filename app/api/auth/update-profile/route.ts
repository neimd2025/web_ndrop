import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()

    console.log('프로필 업데이트 API 호출됨:', { userId, updates })

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

            // 프로필 업데이트
    console.log('프로필 업데이트 시작:', { userId, updates })

    // 잘못된 날짜 값 필터링
    const cleanedUpdates = { ...updates }

    // birth_date가 유효한 날짜 형식인지 확인
    if (cleanedUpdates.birth_date) {
      const date = new Date(cleanedUpdates.birth_date)
      if (isNaN(date.getTime()) || cleanedUpdates.birth_date === '123123123') {
        console.log('잘못된 birth_date 값 제거:', cleanedUpdates.birth_date)
        delete cleanedUpdates.birth_date
      }
    }

    console.log('정리된 업데이트 데이터:', cleanedUpdates)

    const { data, error } = await supabase
      .from('user_profiles')
      .update(cleanedUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('프로필 업데이트 오류:', error)
      return NextResponse.json({
        error: '프로필 업데이트 실패',
        details: error
      }, { status: 500 })
    }

    console.log('프로필 업데이트 성공:', data)

    // 비즈니스카드도 동기화 (해당 사용자의 비즈니스카드가 있는 경우)
    try {
      const { data: businessCard, error: businessCardError } = await supabase
        .from('business_cards')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (businessCard && !businessCardError) {
        // 비즈니스카드 업데이트 (프로필과 동기화)
        const businessCardUpdates: any = {}

        // 프로필에서 비즈니스카드로 동기화할 필드들
        if (cleanedUpdates.full_name) businessCardUpdates.full_name = cleanedUpdates.full_name
        if (cleanedUpdates.company) businessCardUpdates.company = cleanedUpdates.company
        if (cleanedUpdates.affiliation) businessCardUpdates.affiliation = cleanedUpdates.affiliation
        if (cleanedUpdates.role) businessCardUpdates.role = cleanedUpdates.role
        if (cleanedUpdates.contact) businessCardUpdates.contact = cleanedUpdates.contact
        if (cleanedUpdates.email) businessCardUpdates.email = cleanedUpdates.email
        if (cleanedUpdates.introduction) businessCardUpdates.introduction = cleanedUpdates.introduction
        if (cleanedUpdates.external_link) businessCardUpdates.external_link = cleanedUpdates.external_link
        if (cleanedUpdates.mbti) businessCardUpdates.mbti = cleanedUpdates.mbti
        if (cleanedUpdates.keywords) businessCardUpdates.keywords = cleanedUpdates.keywords
        if (cleanedUpdates.work_field) businessCardUpdates.work_field = cleanedUpdates.work_field
        if (cleanedUpdates.hobby_keywords) businessCardUpdates.hobby_keywords = cleanedUpdates.hobby_keywords
        if (cleanedUpdates.interest_keywords) businessCardUpdates.interest_keywords = cleanedUpdates.interest_keywords
        if (cleanedUpdates.personality_keywords) businessCardUpdates.personality_keywords = cleanedUpdates.personality_keywords
        if (cleanedUpdates.profile_image_url) businessCardUpdates.profile_image_url = cleanedUpdates.profile_image_url

        if (Object.keys(businessCardUpdates).length > 0) {
          const { error: businessCardUpdateError } = await supabase
            .from('business_cards')
            .update(businessCardUpdates)
            .eq('id', businessCard.id)

          if (businessCardUpdateError) {
            console.error('비즈니스카드 동기화 오류:', businessCardUpdateError)
          } else {
            console.log('비즈니스카드 동기화 성공')
          }
        }
      }
    } catch (syncError) {
      console.error('비즈니스카드 동기화 오류:', syncError)
      // 동기화 실패해도 프로필 업데이트는 성공으로 처리
    }

    // 프로필 업데이트 알림 생성
    try {
      const updatedFields = Object.keys(cleanedUpdates)
      const updateType = updatedFields.length > 0 ? updatedFields.join(', ') : '프로필'

      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: '프로필 업데이트',
          message: `${updateType}이 업데이트되었습니다`,
          notification_type: 'profile_updated',
          target_type: 'specific',
          user_id: userId,
          metadata: {
            update_type: updateType,
            updated_fields: updatedFields,
            action: 'updated'
          },
          sent_by: null
        })
        .select()
        .single()

      if (notificationError) {
        console.error('프로필 업데이트 알림 생성 오류:', notificationError)
        // 알림 생성 실패해도 프로필 업데이트는 성공으로 처리
      }
    } catch (notificationError) {
      console.error('프로필 업데이트 알림 생성 오류:', notificationError)
      // 알림 생성 실패해도 프로필 업데이트는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: data
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      error: '서버 오류',
      details: error
    }, { status: 500 })
  }
}
