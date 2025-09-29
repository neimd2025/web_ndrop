# 배포 환경 설정 가이드

## 환경변수 설정

### 1. 프로덕션 환경변수 설정

배포 시 다음 환경변수를 설정해야 합니다:

```bash
# 사이트 URL (배포 도메인)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://kyibcvcwwvkldlasxyjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. QR 코드 URL 설정

QR 코드가 올바른 도메인을 사용하도록 설정:

1. **Vercel 배포 시**:
   - Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
   - `NEXT_PUBLIC_SITE_URL`을 `https://your-vercel-domain.vercel.app`로 설정

2. **Netlify 배포 시**:
   - Netlify 대시보드 → Site settings → Environment variables
   - `NEXT_PUBLIC_SITE_URL`을 `https://your-netlify-domain.netlify.app`로 설정

3. **커스텀 도메인 사용 시**:
   - `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 설정 (예: `https://ndrop.com`)

### 3. 개발 환경 설정

로컬 개발 시에는 `.env.local` 파일을 생성하여 설정:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://kyibcvcwwvkldlasxyjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 배포 플랫폼별 설정

### Vercel
1. GitHub 저장소 연결
2. Environment Variables 설정
3. Build Command: `npm run build`
4. Output Directory: `.next`

### Netlify
1. GitHub 저장소 연결
2. Build Command: `npm run build`
3. Publish Directory: `.next`
4. Environment Variables 설정

### AWS Amplify
1. GitHub 저장소 연결
2. Build settings:
   - Build commands: `npm run build`
   - Output directory: `.next`
3. Environment Variables 설정

## 중요 사항

- ✅ **HTTPS 필수**: 모바일 카메라 접근을 위해 HTTPS가 필요합니다
- ✅ **도메인 설정**: QR 코드가 올바른 도메인을 사용하도록 환경변수 설정
- ✅ **Supabase 설정**: 프로덕션 환경에서 Supabase 연결 확인
- ✅ **이미지 도메인**: `next.config.mjs`의 `images.domains`에 Supabase 도메인 추가

## 문제 해결

### QR 코드가 로컬호스트를 가리키는 경우
1. 환경변수 `NEXT_PUBLIC_SITE_URL`이 올바르게 설정되었는지 확인
2. 배포 후 환경변수가 적용되었는지 확인
3. 브라우저 캐시 삭제 후 재시도

### 카메라가 작동하지 않는 경우
1. HTTPS 연결 확인
2. 브라우저에서 카메라 권한 허용
3. 모바일 브라우저에서 테스트
