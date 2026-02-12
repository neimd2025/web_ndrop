-- event_meeting_messages 테이블의 sender_id가 user_profiles 테이블을 참조하도록 외래 키 제약 조건 추가
-- 이렇게 하면 PostgREST가 sender_id를 통해 user_profiles를 직접 조인할 수 있게 됨

ALTER TABLE event_meeting_messages
DROP CONSTRAINT IF EXISTS fk_event_meeting_messages_sender_profile;

ALTER TABLE event_meeting_messages
ADD CONSTRAINT fk_event_meeting_messages_sender_profile
FOREIGN KEY (sender_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;
