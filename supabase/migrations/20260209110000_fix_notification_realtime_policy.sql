-- 1. Notifications 테이블의 RLS(Row Level Security) 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. 인증된 사용자에게 권한 부여
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- 3. [중요] 수신자(본인)가 자신의 알림을 볼 수 있게 허용 (실시간 알림 수신에 필수)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. [중요] 발신자가 알림을 생성할 수 있게 허용 (Admin 클라이언트 실패 시 백업용)
DROP POLICY IF EXISTS "Users can insert notifications sent by them" ON notifications;
CREATE POLICY "Users can insert notifications sent by them"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sent_by);

-- 5. 수신자가 알림을 '읽음' 상태로 변경할 수 있게 허용
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6. [핵심] Supabase Realtime(실시간) 구독 대상에 notifications 테이블 추가
-- 이 설정이 없으면 DB에 저장되어도 프론트엔드로 알림이 날아가지 않습니다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
