import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kyibcvcwwvkldlasxyjn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aWJjdmN3d3ZrbGRsYXN4eWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTIxNjksImV4cCI6MjA2OTQyODE2OX0.LAmSL9sy3wr3ZzZ3wh3VZ6Xti5dCUjR4RLjxY68xseM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('🌱 데이터베이스 시드 데이터 추가 시작...')

  try {
    // 1. 샘플 이벤트 추가
    console.log('📅 이벤트 데이터 추가 중...')
    const events = [
      {
        title: 'ndrop 네트워킹 데모 이벤트',
        description: 'ndrop 앱을 소개하는 네트워킹 이벤트입니다.',
        event_code: 'DEMO001',
        start_date: '2025-01-25T10:00:00Z',
        end_date: '2025-01-25T18:00:00Z',
        location: '서울 강남구',
        max_participants: 50,
        current_participants: 25,
        status: 'ongoing'
      },
      {
        title: '스타트업 네트워킹 밋업',
        description: '스타트업 창업자들을 위한 네트워킹 모임입니다.',
        event_code: 'STARTUP001',
        start_date: '2025-01-30T14:00:00Z',
        end_date: '2025-01-30T17:00:00Z',
        location: '서울 마포구',
        max_participants: 30,
        current_participants: 15,
        status: 'upcoming'
      },
      {
        title: '개발자 커뮤니티 모임',
        description: '개발자들을 위한 기술 공유 및 네트워킹 모임입니다.',
        event_code: 'DEV001',
        start_date: '2025-01-20T19:00:00Z',
        end_date: '2025-01-20T22:00:00Z',
        location: '서울 서초구',
        max_participants: 40,
        current_participants: 40,
        status: 'completed'
      }
    ]

    for (const event of events) {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()

      if (error) {
        console.error('이벤트 추가 오류:', error)
      } else {
        console.log('✅ 이벤트 추가됨:', data[0].title)
      }
    }

    // 2. 샘플 알림 추가
    console.log('🔔 알림 데이터 추가 중...')
    const notifications = [
      {
        title: '새로운 이벤트가 등록되었습니다',
        message: 'ndrop 네트워킹 데모 이벤트에 참가해보세요!',
        target_type: 'all',
        sent_at: new Date().toISOString(),
        delivered_count: 0,
        read_count: 0
      },
      {
        title: '명함이 수집되었습니다',
        message: '새로운 연결을 확인해보세요',
        target_type: 'all',
        sent_at: new Date().toISOString(),
        delivered_count: 0,
        read_count: 0
      }
    ]

    for (const notification of notifications) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()

      if (error) {
        console.error('알림 추가 오류:', error)
      } else {
        console.log('✅ 알림 추가됨:', data[0].title)
      }
    }

    console.log('🎉 데이터베이스 시드 완료!')
  } catch (error) {
    console.error('❌ 데이터베이스 시드 오류:', error)
  }
}

// 스크립트 실행
seedDatabase()
