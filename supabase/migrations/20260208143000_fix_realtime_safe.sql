-- 안전한 통합 마이그레이션: 알림 RLS 수정 및 실시간 채팅 활성화 (에러 방지)
-- 이 파일은 Supabase 대시보드 SQL Editor에서 실행해야 합니다.

-- 1. Notifications 테이블 RLS 수정 (다른 사람에게 알림 보내기 허용)
-- 기존 정책이 있으면 삭제하고 다시 만듭니다.
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;

-- 인증된 사용자는 누구나 알림을 생성할 수 있도록 허용 (sent_by 검증 포함)
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = sent_by
  );

-- 2. Realtime 설정 (이미 추가되어 있어도 에러가 나지 않도록 처리)
DO $$
BEGIN
  -- event_meeting_messages 테이블이 이미 publication에 있는지 확인하고 없으면 추가
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'event_meeting_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_meeting_messages;
  END IF;

  -- notifications 테이블이 이미 publication에 있는지 확인하고 없으면 추가
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
