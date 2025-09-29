-- interest_keywords 컬럼 추가 마이그레이션
-- 실행 전에 Supabase 대시보드의 SQL Editor에서 실행하거나
-- 또는 프로젝트 루트에서 다음 명령어로 실행:
-- npx supabase db reset --db-url "your-database-url"

-- business_cards 테이블에 interest_keywords 컬럼 추가
ALTER TABLE business_cards
ADD COLUMN IF NOT EXISTS interest_keywords TEXT[];

-- user_profiles 테이블에 interest_keywords 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS interest_keywords TEXT[];

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_cards'
AND column_name = 'interest_keywords';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'interest_keywords';

-- 기본값 설정 (기존 데이터의 경우)
UPDATE business_cards
SET interest_keywords = NULL
WHERE interest_keywords IS NULL;

UPDATE user_profiles
SET interest_keywords = NULL
WHERE interest_keywords IS NULL;
