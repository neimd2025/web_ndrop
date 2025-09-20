"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UserTermsClientProps {
  user: UserProfile
}

export function UserTermsClient({ user }: UserTermsClientProps) {
  // 약관 내용 가져오기
  const getTermsContent = (type: 'service' | 'privacy' | 'marketing') => {
    switch (type) {
      case 'service':
        return {
          title: '서비스 이용약관',
          content: `제1조 (목적)
이 약관은 Neimd(이하 "회사")가 제공하는 디지털 명함 및 네트워킹 플랫폼 관련 서비스(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.
② "회원"이란 서비스에 개인정보를 제공하고 회원가입을 완료한 자를 의미합니다.
③ "디지털 명함"이란 회원이 작성한 자기소개 정보(이름, 역할, 키워드 등)를 기반으로 구성된 온라인 명함입니다.
④ "행사 제출"이란 회원이 자신의 명함을 특정 행사 또는 주최 측에 제출하는 기능을 의미합니다.

제3조 (약관의 효력 및 변경)
① 본 약관은 회원이 서비스에 가입함으로써 효력이 발생합니다.
② 회사는 관련 법령에 따라 약관을 개정할 수 있으며, 개정 시 공지사항 또는 이메일로 고지합니다.
③ 개정 약관에 동의하지 않을 경우 회원 탈퇴가 가능하며, 이의 없이 계속 이용 시 변경 약관에 동의한 것으로 간주됩니다.`
        }
      case 'privacy':
        return {
          title: '개인정보처리방침',
          content: `제1조 (개인정보의 처리목적)
Neimd(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.

1. 서비스 제공
- 디지털 명함 생성 및 관리
- 사용자 맞춤형 콘텐츠 제공
- 고객 상담 및 문의 응답

2. 회원 관리
- 회원가입 의사 확인
- 개인 식별
- 불량회원의 부정 이용 방지

3. 마케팅 및 광고 활용
- 신규 서비스 개발 및 맞춤 서비스 제공
- 이벤트 및 광고성 정보 제공`
        }
      case 'marketing':
        return {
          title: '마케팅 정보 수신 동의',
          content: `제1조 (마케팅 정보 수신 동의)
회원은 회사가 제공하는 다음과 같은 마케팅 정보 수신에 대해 선택적으로 동의할 수 있습니다.

1. 수신 방법
- 이메일
- 문자메시지(SMS)
- 앱 푸시 알림

2. 수신 내용
- 신규 서비스 안내
- 이벤트 및 프로모션 정보
- 맞춤형 콘텐츠 추천

3. 동의 철회
회원은 언제든지 마케팅 정보 수신 동의를 철회할 수 있으며, 마이페이지에서 설정을 변경하거나 고객센터를 통해 요청할 수 있습니다.`
        }
      default:
        return { title: '', content: '' }
    }
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/user/my-page">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">약관 및 정책</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-6">
        {/* 서비스 이용약관 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {getTermsContent('service').title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {getTermsContent('service').content}
            </div>
          </CardContent>
        </Card>

        {/* 개인정보처리방침 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {getTermsContent('privacy').title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {getTermsContent('privacy').content}
            </div>
          </CardContent>
        </Card>

        {/* 마케팅 정보 수신 동의 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {getTermsContent('marketing').title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {getTermsContent('marketing').content}
            </div>
          </CardContent>
        </Card>

        {/* 문의 안내 */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">문의사항</h3>
            <p className="text-sm text-gray-600">
              약관 및 개인정보처리방침에 대한 문의사항이 있으시면 고객센터로 연락해 주세요.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              이메일: support@neimd.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}