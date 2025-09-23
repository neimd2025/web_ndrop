-- events 테이블에 이벤트 상세 정보 필드들 추가
ALTER TABLE events
ADD COLUMN IF NOT EXISTS overview_points TEXT[],
ADD COLUMN IF NOT EXISTS target_audience TEXT[],
ADD COLUMN IF NOT EXISTS special_benefits TEXT[];

-- 기존 이벤트에 기본값 설정 (선택사항)
UPDATE events
SET
  overview_points = ARRAY[
    '디지털 명함을 통한 새로운 네트워킹 경험',
    '다양한 분야 전문가들과의 만남',
    '실시간 명함 교환 및 피드백'
  ],
  target_audience = ARRAY[
    'IT/스타트업 관계자 - 디지털 트랜스포메이션에 관심 있는 분',
    '새로운 네트워킹 방식을 경험하고 싶은 분'
  ],
  special_benefits = ARRAY[
    'Neimed 앱 사용법 가이드 제공',
    '네트워킹 노하우 공유 세션',
    '참가자 전용 커뮤니티 초대'
  ]
WHERE overview_points IS NULL;
