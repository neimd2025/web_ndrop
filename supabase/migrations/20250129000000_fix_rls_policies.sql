-- RLS 정책 수정 마이그레이션
-- 이 스크립트는 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. business_cards 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON business_cards;
DROP POLICY IF EXISTS "Public cards are viewable by everyone" ON business_cards;

-- RLS 활성화
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view own cards" ON business_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON business_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON business_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON business_cards
  FOR DELETE USING (auth.uid() = user_id);

-- 공개 명함은 모든 인증된 사용자가 볼 수 있음
CREATE POLICY "Public cards are viewable by everyone" ON business_cards
  FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- 2. user_profiles 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- 3. collected_cards 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own collected cards" ON collected_cards;
DROP POLICY IF EXISTS "Users can insert own collected cards" ON collected_cards;
DROP POLICY IF EXISTS "Users can update own collected cards" ON collected_cards;
DROP POLICY IF EXISTS "Users can delete own collected cards" ON collected_cards;

-- RLS 활성화
ALTER TABLE collected_cards ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view own collected cards" ON collected_cards
  FOR SELECT USING (auth.uid() = collector_id);

CREATE POLICY "Users can insert own collected cards" ON collected_cards
  FOR INSERT WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Users can update own collected cards" ON collected_cards
  FOR UPDATE USING (auth.uid() = collector_id);

CREATE POLICY "Users can delete own collected cards" ON collected_cards
  FOR DELETE USING (auth.uid() = collector_id);

-- 4. events 테이블 RLS 정책 설정 (읽기 전용)
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Everyone can view events" ON events;

-- RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 이벤트를 볼 수 있음
CREATE POLICY "Everyone can view events" ON events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. event_participants 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own participations" ON event_participants;
DROP POLICY IF EXISTS "Users can insert own participations" ON event_participants;
DROP POLICY IF EXISTS "Users can update own participations" ON event_participants;
DROP POLICY IF EXISTS "Users can delete own participations" ON event_participants;

-- RLS 활성화
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view own participations" ON event_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own participations" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participations" ON event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own participations" ON event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- 6. notifications 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR target_type = 'all');

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. roles 테이블 RLS 정책 설정 (읽기 전용)
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Everyone can view roles" ON roles;

-- RLS 활성화
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 역할을 볼 수 있음
CREATE POLICY "Everyone can view roles" ON roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 8. feedback 테이블 RLS 정책 설정
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON feedback;

-- RLS 활성화
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON feedback
  FOR DELETE USING (auth.uid() = user_id);

-- 정책 확인 쿼리
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
