-- notifications 테이블 RLS 정책 수정
-- 사용자가 다른 사용자에게 알림을 보낼 수 있도록 INSERT 정책을 수정합니다.

-- 기존 INSERT 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

-- 새로운 INSERT 정책 생성
-- 인증된 사용자는 누구나 알림을 생성할 수 있습니다.
-- sent_by 컬럼이 현재 사용자 ID와 일치해야 합니다. (스푸핑 방지)
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = sent_by
  );

-- 만약 sent_by 컬럼을 사용하지 않고, 단순히 시스템 로직상 누구나 알림을 넣을 수 있게 하려면:
-- CREATE POLICY "Anyone can create notifications" ON notifications
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
