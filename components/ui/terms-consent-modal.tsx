'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import { ChevronRight, X } from 'lucide-react'
import { useState } from 'react'

interface TermsConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConsent: (consentData: {
    allConsent: boolean
    serviceTerms: boolean
    privacyPolicy: boolean
    marketingConsent: boolean
  }) => void
}

type TermsType = 'service' | 'privacy' | 'marketing' | null

export function TermsConsentModal({ isOpen, onClose, onConsent }: TermsConsentModalProps) {
  const [allConsent, setAllConsent] = useState(false)
  const [serviceTerms, setServiceTerms] = useState(false)
  const [privacyPolicy, setPrivacyPolicy] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [selectedTerms, setSelectedTerms] = useState<TermsType>(null)

  const handleAllConsentChange = (checked: boolean) => {
    setAllConsent(checked)
    setServiceTerms(checked)
    setPrivacyPolicy(checked)
    setMarketingConsent(checked)
  }

  const handleIndividualConsentChange = () => {
    const allChecked = serviceTerms && privacyPolicy && marketingConsent
    setAllConsent(allChecked)
  }

  const handleServiceTermsChange = (checked: boolean) => {
    setServiceTerms(checked)
    if (!checked) setAllConsent(false)
    else if (checked && privacyPolicy && marketingConsent) setAllConsent(true)
  }

  const handlePrivacyPolicyChange = (checked: boolean) => {
    setPrivacyPolicy(checked)
    if (!checked) setAllConsent(false)
    else if (checked && serviceTerms && marketingConsent) setAllConsent(true)
  }

  const handleMarketingConsentChange = (checked: boolean) => {
    setMarketingConsent(checked)
    if (!checked) setAllConsent(false)
    else if (checked && serviceTerms && privacyPolicy) setAllConsent(true)
  }

  const handleConfirm = () => {
    onConsent({
      allConsent,
      serviceTerms,
      privacyPolicy,
      marketingConsent
    })
    onClose()
  }

  const handleTermsClick = (termsType: TermsType) => {
    setSelectedTerms(termsType)
  }

  const handleCloseTerms = () => {
    setSelectedTerms(null)
  }

  const getTermsContent = (termsType: TermsType) => {
    switch (termsType) {
      case 'service':
        return {
          title: '서비스 이용약관',
          content: `
제1조 (목적)
이 약관은 Neimd(이하 "회사")가 제공하는 디지털 명함 및 네트워킹 플랫폼 관련 서비스(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
제2조 (정의)
① "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.
② "회원"이란 서비스에 개인정보를 제공하고 회원가입을 완료한 자를 의미합니다.
③ "디지털 명함"이란 회원이 작성한 자기소개 정보(이름, 역할, 키워드 등)를 기반으로 구성된 온라인 명함입니다.
④ "행사 제출"이란 회원이 자신의 명함을 특정 행사 또는 주최 측에 제출하는 기능을 의미합니다.
제3조 (약관의 효력 및 변경)
① 본 약관은 회원이 서비스에 가입함으로써 효력이 발생합니다.
② 회사는 관련 법령에 따라 약관을 개정할 수 있으며, 개정 시 공지사항 또는 이메일로 고지합니다.
③ 개정 약관에 동의하지 않을 경우 회원 탈퇴가 가능하며, 이의 없이 계속 이용 시 변경 약관에 동의한 것으로 간주됩니다.
제4조 (회원가입 및 이용계약 체결)
① 이용자는 회사가 정한 절차에 따라 회원가입을 신청해야 하며, 필수 항목에 정확한 정보를 입력해야 합니다.
② 회사는 가입 신청자 중 다음의 경우 가입을 거절하거나 사후에 탈퇴시킬 수 있습니다:
1. 타인의 명의 도용
2. 허위 정보 입력
3. 부정한 목적이나 수단으로 가입 시도
제5조 (회원의 의무)
① 회원은 다음 행위를 해서는 안 됩니다:
1. 타인의 개인정보 도용 또는 사칭
2. 허위 명함 작성 또는 타인을 모욕하는 내용 기재
3. 서비스의 정상 운영을 방해하는 행위
4. 회사의 사전 승인 없이 상업적 목적의 홍보, 광고
② 회원은 본인의 정보가 변경된 경우 지체 없이 수정해야 하며, 미수정으로 인한 불이익은 회원 본인의 책임입니다.
제6조 (회사의 의무)
① 회사는 관련 법령 및 본 약관이 정하는 바에 따라 성실히 서비스를 제공합니다.
② 회사는 개인정보 보호를 위해 최선을 다하며, 명시된 목적 외에는 회원 정보를 사용하지 않습니다.
제7조 (서비스의 변경 및 중단)
① 회사는 서비스 제공을 위해 필요한 경우 사전 고지 후 일시적으로 중단할 수 있습니다.
② 기술적 장애, 천재지변, 내부 정책 변경 등으로 인해 서비스가 변경 또는 종료될 수 있습니다.
제8조 (지적재산권)
① 서비스 내 제공된 콘텐츠에 대한 저작권은 회사 또는 해당 권리자에게 있으며, 무단 복제/배포/상업적 이용을 금합니다.
② 회원이 작성한 명함 및 콘텐츠에 대한 저작권은 해당 회원에게 있으나, 회사는 서비스 운영을 위한 범위 내에서 이를 사용할 수 있습니다.
제9조 (계약 해지 및 탈퇴)
① 회원은 언제든지 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 처리합니다.
② 회원이 약관을 위반한 경우, 회사는 사전 통지 후 계정을 제한하거나 탈퇴 조치할 수 있습니다.
제10조 (면책조항)
① 회사는 다음의 경우에 책임을 지지 않습니다:
1. 회원 본인의 실수로 인한 정보 노출
2. 제3자 간의 분쟁
3. 시스템 점검, 유지보수로 인한 일시적 서비스 중단
          `
        }
      case 'privacy':
        return {
          title: '개인정보 처리방침',
          content: `
Neimd(이하 "회사")는 정보주체의 개인정보 보호를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하여 아래와 같이 처리방침을 안내드립니다.
제1조 (수집하는 개인정보 항목)
① 회원가입 시 수집: 이름, 이메일, 비밀번호
② 명함 작성 시 수집: 나이, 소속, 역할, 자기소개, MBTI, 키워드, 취미, 대표 링크, 프로필 사진 등 (선택 항목 포함)
③ 행사 참여 시 수집: 참여 행사 정보, 제출 명함 기록
제2조 (개인정보 수집 방법)
• 웹페이지(회원가입, 명함 생성, 행사 참여 등)
• 자동 수집: 서비스 이용 로그, 접속 IP
제3조 (개인정보 이용 목적)
• 회원 식별 및 계정 관리
• 명함 서비스 제공 및 행사 연동
• 불량 이용자 제재 및 고객 응대
• 법령에 따른 의무 이행
제4조 (보유 및 이용 기간)
• 회원 탈퇴 시까지 보관하며, 관련 법령에 따라 일정 기간 보존할 수 있음 (예: 통신사실확인자료 3개월 등)
제5조 (개인정보 제3자 제공)
• 회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
• 단, 법령에 의거하거나 수사기관의 요청이 있을 경우 예외적으로 제공할 수 있습니다.
제6조 (개인정보 처리 위탁)
• 현재 개인정보 처리 위탁은 이루어지지 않으며, 향후 위탁 시 사전 고지 후 동의를 받습니다.
제7조 (정보주체의 권리)
• 개인정보 열람, 수정, 삭제 요청 가능
• 마케팅 수신 동의 철회 가능
• 회원탈퇴 시 모든 정보는 지체 없이 파기됩니다.
제8조 (개인정보 보호책임자)
• 이름: [허수정]
• 연락처: [nala0124@naver.com]
          `
        }
      case 'marketing':
        return {
          title: '마케팅 정보 수신 동의',
          content: `
마케팅 정보 수신 동의
1. 목적
서비스 관련 정보, 이벤트 소식, 맞춤형 콘텐츠 제공
2. 수집·이용 항목
•이메일 주소, 서비스 이용 기록, 관심 분야
3. 보유·이용 기간
동의 철회 시 또는 회원 탈퇴 시까지
4. 동의 거부권
마케팅 정보 수신에 대한 동의를 거부할 권리가 있으며, 동의 거부 시에도 서비스 이용이 가능합니다.
5. 발송 방법
•이메일, 앱 푸시 알림, 앱 내 알림
6. 수신 거부
마이페이지에서 언제든지 수신을 거부할 수 있습니다.

          `
        }
      default:
        return { title: '', content: '' }
    }
  }

  const isRequiredConsentsGiven = serviceTerms && privacyPolicy

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="max-w-md mx-auto h-[80vh] rounded-t-lg">
          <div className="flex items-center justify-between pb-4">
            <SheetHeader className="flex-1">
              <SheetTitle className="text-center text-lg font-semibold">
                약관 동의
              </SheetTitle>
            </SheetHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* 전체 동의 */}
            <div className="flex items-center justify-between p-4  rounded-lg">
              <div className="flex items-center space-x-3">
                <label className="relative">
                  <input
                    type="checkbox"
                    checked={allConsent}
                    onChange={(e) => handleAllConsentChange(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    allConsent
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {allConsent && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </label>
                <span className="font-medium text-gray-900">전체 동의</span>
              </div>
            </div>

            <div className="text-sm text-gray-500 px-1">
              서비스 이용약관, 개인정보 처리방침, 마케팅 정보 수신에 모두 동의합니다.
            </div>

            {/* 개별 동의 항목들 */}
            <div className="space-y-3">
              {/* 서비스 이용약관 (필수) */}
              <div
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover: transition-colors"
                onClick={() => handleTermsClick('service')}
              >
                <div className="flex items-center space-x-3">
                  <label className="relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={serviceTerms}
                      onChange={(e) => handleServiceTermsChange(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      serviceTerms
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {serviceTerms && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </label>
                  <div>
                    <span className="font-medium text-gray-900">서비스 이용약관</span>
                    <span className="text-red-500 ml-1">(필수)</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* 개인정보 처리방침 (필수) */}
              <div
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover: transition-colors"
                onClick={() => handleTermsClick('privacy')}
              >
                <div className="flex items-center space-x-3">
                  <label className="relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={privacyPolicy}
                      onChange={(e) => handlePrivacyPolicyChange(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      privacyPolicy
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {privacyPolicy && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </label>
                  <div>
                    <span className="font-medium text-gray-900">개인정보 처리방침</span>
                    <span className="text-red-500 ml-1">(필수)</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* 마케팅 정보 수신 동의 (선택) */}
              <div
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover: transition-colors"
                onClick={() => handleTermsClick('marketing')}
              >
                <div className="flex items-center space-x-3">
                  <label className="relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => handleMarketingConsentChange(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      marketingConsent
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {marketingConsent && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </label>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">마케팅 정보 수신 동의</span>
                    <span className="text-gray-500 ml-1">(선택)</span>
                    <div className="text-xs text-gray-500 mt-1">
                      이벤트, 혜택 정보를 받아보실 수 있습니다
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 확인 버튼 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
            <Button
              onClick={handleConfirm}
              disabled={!isRequiredConsentsGiven}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
            >
              확인
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 약관 내용 모달 */}
      <Dialog open={selectedTerms !== null} onOpenChange={handleCloseTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {getTermsContent(selectedTerms).title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                {getTermsContent(selectedTerms).content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleCloseTerms} className="bg-purple-600 hover:bg-purple-700">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
