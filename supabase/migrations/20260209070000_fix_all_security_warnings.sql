
-- 1. 모든 보안 경고 테이블에 RLS(보안) 활성화
ALTER TABLE collected_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- 백업 테이블은 선택사항이지만 보안을 위해 활성화 권장
ALTER TABLE notifications_backup ENABLE ROW LEVEL SECURITY;

-- 2. Notifications 테이블 보안 정책 재설정 (기존 정책 삭제 후 재생성)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view public notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role has full access" ON notifications;

-- 내 알림 보기 허용
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (
  auth.uid() = user_id
);

-- 전체 공지 보기 허용
CREATE POLICY "Users can view public notifications"
ON notifications FOR SELECT
USING (
  target_type = 'all'
);

-- 3. 실시간 알림 설정 (에러 방지를 위한 안전한 추가)
-- 이미 추가되어 있으면 무시하고, 없으면 추가함
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
