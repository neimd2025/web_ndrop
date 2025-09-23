-- work_field 컬럼 추가 마이그레이션
-- 실행 전에 Supabase 대시보드의 SQL Editor에서 실행하거나
-- 또는 프로젝트 루트에서 다음 명령어로 실행:
-- npx supabase db reset --db-url "your-database-url"

-- user_profiles 테이블에 work_field 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS work_field TEXT;

-- business_cards 테이블에 work_field 컬럼 추가
ALTER TABLE business_cards
ADD COLUMN IF NOT EXISTS work_field TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'work_field';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_cards'
AND column_name = 'work_field';

-- 기본값 설정 (기존 데이터의 경우)
UPDATE user_profiles
SET work_field = NULL
WHERE work_field IS NULL;

UPDATE business_cards
SET work_field = NULL
WHERE work_field IS NULL;
