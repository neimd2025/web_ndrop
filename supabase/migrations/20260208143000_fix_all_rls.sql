-- 1. Notifications 테이블 RLS 수정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (충돌 방지)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 새로운 정책 생성
-- 1) 알림 생성: 보낸 사람(sent_by)이 본인이면 누구에게나 알림을 보낼 수 있음
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = sent_by
  );

-- 2) 알림 조회: 본인이 수신자(user_id)인 알림만 조회 가능
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 3) 알림 수정: 본인이 수신자(user_id)인 알림만 수정 가능 (읽음 처리 등)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );


-- 2. Event Meeting Messages 테이블 RLS 수정
ALTER TABLE event_meeting_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON event_meeting_messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON event_meeting_messages;

-- 1) 메시지 조회: 미팅의 참여자(요청자 또는 수신자)만 조회 가능
CREATE POLICY "Participants can view messages" ON event_meeting_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_meetings em
      WHERE em.id = meeting_id
      AND (em.requester_id = auth.uid() OR em.receiver_id = auth.uid())
    )
  );

-- 2) 메시지 전송: 본인이 발신자(sender_id)여야 함 (추가적인 미팅 참여 여부는 트리거로 체크하거나 생략)
CREATE POLICY "Participants can insert messages" ON event_meeting_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );


-- 3. Event Meetings 테이블 RLS 확인 (참조 무결성을 위해)
ALTER TABLE event_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view meetings" ON event_meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON event_meetings;
DROP POLICY IF EXISTS "Participants can update meetings" ON event_meetings;

-- 1) 미팅 조회: 참여자만 조회 가능
CREATE POLICY "Participants can view meetings" ON event_meetings
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  );

-- 2) 미팅 생성: 요청자가 본인이면 생성 가능
CREATE POLICY "Users can create meetings" ON event_meetings
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
  );

-- 3) 미팅 수정: 참여자만 수정 가능
CREATE POLICY "Participants can update meetings" ON event_meetings
  FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  );


-- 4. Realtime Publication 설정 (중요)
-- 이미 존재할 수 있으므로 DO 블록으로 감싸서 처리
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
END $$;
