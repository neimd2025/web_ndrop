-- 통합 마이그레이션: 알림 RLS 수정 및 실시간 채팅 활성화
-- 이 파일은 Supabase 대시보드 SQL Editor에서 실행해야 합니다.

-- 1. Notifications 테이블 RLS 수정 (다른 사람에게 알림 보내기 허용)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;

-- 인증된 사용자는 누구나 알림을 생성할 수 있도록 허용 (sent_by 검증 포함)
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = sent_by
  );

-- 2. 채팅 메시지 테이블 실시간 구독(Realtime) 활성화
-- Supabase Realtime을 사용하기 위해 publication에 테이블 추가
-- 이미 추가되어 있을 수 있으므로, 에러 방지를 위해 확인 후 실행하거나
-- 아래 명령어를 실행하면 됩니다. (중복 추가는 무시되거나 에러가 날 수 있지만, SQL Editor에서는 보통 안전)

ALTER PUBLICATION supabase_realtime ADD TABLE event_meeting_messages;

-- 3. (옵션) Notifications 테이블도 실시간 알림을 위해 추가
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
