-- 1. Realtime Publication 설정 (강제 재적용)
-- 기존 설정을 확인하지 않고 무조건 추가 시도 (IF NOT EXISTS 사용)

DO $$
BEGIN
  -- event_meeting_messages
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'event_meeting_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_meeting_messages;
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- event_meetings
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'event_meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_meetings;
  END IF;
END $$;

-- 2. REPLICA IDENTITY 설정 (UPDATE/DELETE 시 전체 데이터 수신을 위해 필요할 수 있음)
-- 기본값(DEFAULT)이면 PK만 오는데, 우리는 INSERT 위주라 괜찮지만 안전하게 설정
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE event_meetings REPLICA IDENTITY FULL;
ALTER TABLE event_meeting_messages REPLICA IDENTITY FULL;
