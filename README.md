# ndrop - 모두의 특별함이, 나답게 연결되는 시작

ndrop는 현대적인 비즈니스 카드 교환 및 네트워킹 플랫폼입니다. 사용자와 관리자를 완전히 분리한 이중 인증 시스템을 통해 안전하고 효율적인 명함 관리 서비스를 제공합니다.

## 🚀 주요 기능

### 사용자 기능
- **📱 디지털 명함 생성**: 개인화된 비즈니스 카드 제작
- **🔍 명함 스캔**: QR 코드를 통한 빠른 명함 교환
- **💾 명함 저장**: 수집한 명함을 체계적으로 관리
- **📅 이벤트 참여**: 네트워킹 이벤트 참여 및 관리
- **🔔 실시간 알림**: 이벤트 및 메시지 알림
- **👤 프로필 관리**: 개인 정보 및 설정 관리

### 관리자 기능
- **📊 대시보드**: 전체 시스템 현황 모니터링
- **🎪 이벤트 관리**: 네트워킹 이벤트 생성 및 관리
- **👥 사용자 관리**: 회원 정보 및 권한 관리
- **📢 알림 발송**: 전체 사용자 대상 공지사항 발송
- **📈 피드백 관리**: 사용자 피드백 수집 및 분석

## 🏗️ 기술 스택

### Frontend
- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **Zustand** - 경량 상태 관리
- **React Hook Form** - 폼 관리 및 검증
- **Zod** - 스키마 검증

### Backend & Database
- **Supabase** - 백엔드 서비스 (Auth, Database, Real-time)
- **PostgreSQL** - 관계형 데이터베이스
- **Row Level Security (RLS)** - 데이터 보안

### 인증 & 보안
- **Supabase Auth** - 사용자 인증 및 세션 관리
- **OAuth 2.0** - Google, Kakao, Naver 소셜 로그인
- **JWT 토큰** - 안전한 세션 관리
- **미들웨어 보호** - 라우트 기반 접근 제어

## 📋 시스템 요구사항

- Node.js 18+
- npm 또는 pnpm
- Supabase 계정
- 환경 변수 설정

## 🛠️ 설치 및 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd web-ndrop
```

### 2. 의존성 설치
```bash
npm install
# 또는
pnpm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 데이터베이스 설정
Supabase 대시보드에서 다음 테이블들을 생성하세요:

```sql
-- 역할 테이블
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  role VARCHAR,
  role_id INTEGER REFERENCES roles(id),
  company VARCHAR,
  contact VARCHAR,
  profile_image_url VARCHAR,
  qr_code_url VARCHAR,
  introduction TEXT,
  mbti VARCHAR,
  keywords TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 비즈니스 카드 테이블
CREATE TABLE business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  full_name VARCHAR NOT NULL,
  email VARCHAR,
  contact VARCHAR,
  company VARCHAR,
  role VARCHAR,
  introduction TEXT,
  profile_image_url VARCHAR,
  qr_code_url VARCHAR,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 이벤트 테이블
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  event_code VARCHAR UNIQUE,
  organizer_name VARCHAR,
  organizer_email VARCHAR,
  organizer_phone VARCHAR,
  organizer_kakao VARCHAR,
  created_by UUID REFERENCES user_profiles(id),
  status VARCHAR DEFAULT 'active',
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 수집된 명함 테이블
CREATE TABLE collected_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID REFERENCES user_profiles(id),
  card_id UUID REFERENCES business_cards(id),
  collected_at TIMESTAMP DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT false
);

-- 이벤트 참가자 테이블
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES user_profiles(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  target_type VARCHAR NOT NULL,
  target_ids TEXT[],
  target_event_id UUID REFERENCES events(id),
  sent_by UUID REFERENCES user_profiles(id),
  sent_at TIMESTAMP,
  status VARCHAR DEFAULT 'draft',
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 피드백 테이블
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  event_id UUID REFERENCES events(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. 개발 서버 실행
```bash
npm run dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 🔐 인증 시스템

### 사용자/관리자 분리 구조
ndrop는 사용자와 관리자를 완전히 분리한 이중 인증 시스템을 구현합니다:

- **사용자 인증**: `/user/*` 경로로 접근하는 일반 사용자
- **관리자 인증**: `/admin/*` 경로로 접근하는 관리자
- **역할 기반 접근 제어**: `role_id`를 통한 권한 관리 (1: 사용자, 2: 관리자)

### 인증 플로우
1. **회원가입**: 이메일/비밀번호 또는 소셜 로그인
2. **이메일 인증**: 사용자는 이메일 인증 필요, 관리자는 자동 인증
3. **프로필 생성**: 자동으로 사용자 프로필 및 비즈니스 카드 생성
4. **권한 확인**: 미들웨어를 통한 라우트 보호


## 📁 프로젝트 구조

```
web-ndrop/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 공통 인증 페이지
│   │   ├── login/               # 통합 로그인 페이지
│   │   ├── signup/              # 통합 회원가입 페이지
│   │   └── callback/            # OAuth 콜백 처리
│   ├── admin/                   # 관리자 전용 페이지
│   │   ├── (auth)/             # 관리자 인증
│   │   ├── dashboard/          # 관리자 대시보드
│   │   ├── events/             # 이벤트 관리
│   │   └── members/            # 사용자 관리
│   ├── user/                   # 사용자 전용 페이지
│   │   ├── home/               # 사용자 홈
│   │   ├── my-page/            # 프로필 관리
│   │   ├── business-card/      # 명함 관리
│   │   └── events/             # 이벤트 참여
│   └── api/                    # API 라우트
│       └── auth/               # 인증 관련 API
├── components/                  # 재사용 가능한 컴포넌트
│   ├── ui/                     # 기본 UI 컴포넌트
│   ├── admin/                  # 관리자 전용 컴포넌트
│   └── auth-initializer.tsx    # 인증 초기화
├── stores/                     # Zustand 상태 관리
│   ├── user-auth-store.ts      # 사용자 인증 상태
│   └── admin-auth-store.ts     # 관리자 인증 상태
├── utils/                      # 유틸리티 함수
│   └── supabase/              # Supabase 클라이언트
├── types/                      # TypeScript 타입 정의
├── hooks/                      # 커스텀 React 훅
└── lib/                        # 라이브러리 및 상수
```

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel 계정에 GitHub 저장소 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 수동 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 실행
npm test -- --testNamePattern="auth"

# 테스트 커버리지 확인
npm run test:coverage
```

## 📱 PWA 지원

ndrop는 Progressive Web App으로 구현되어 있습니다:
- **오프라인 지원**: 기본 기능 오프라인에서도 사용 가능
- **앱 설치**: 모바일 기기에 앱으로 설치 가능
- **푸시 알림**: 실시간 알림 지원

## 🔧 개발 가이드

### 코드 스타일
- **TypeScript**: 모든 코드는 TypeScript로 작성
- **ESLint**: 코드 품질 및 일관성 유지
- **Prettier**: 코드 포맷팅 자동화

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 프로세스 또는 보조 도구 변경
```

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-repo/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **이메일**: support@ndrop.com

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받아 만들어졌습니다:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**ndrop와 함께 더 나은 네트워킹을 시작하세요!** 🚀


reintegrate9

..




