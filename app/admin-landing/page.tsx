"use client"

import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, CheckCircle2, Mail, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <header className="flex items-center justify-between py-4 lg:py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/assets/logo-text.png"
              alt="ndrop logo"
              className="h-6 w-auto"
            />
            <span className="hidden sm:inline-flex text-xs font-semibold text-slate-700 border border-slate-200 rounded-full px-2 py-0.5 bg-slate-50">
              Event Console
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login?type=user">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 h-9 text-xs"
              >
                참가자용 ndrop
              </Button>
            </Link>
            <Link href="/login?type=admin&returnTo=/admin">
              <Button className="bg-white text-slate-950 hover:bg-gray-100 rounded-full px-4 h-9 text-xs font-semibold">
                관리자 로그인
              </Button>
            </Link>
          </div>
        </header>

        <main className="pb-20 lg:pb-24 space-y-20 lg:space-y-28">
          <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center pt-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>행사 운영자를 위한 네트워킹 운영 콘솔</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                네트워킹이 잘 되는 행사는
                <br />
                준비 단계부터 다릅니다.
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  ndrop이 행사 운영의 디폴트가 되도록.
                </span>
              </h1>
              <p className="text-sm lg:text-base text-slate-600 leading-relaxed max-w-xl">
                참가자 모집부터 현장 체크인, 1:1 매칭, 사후 리포트까지.
                한 곳에서 관리할 수 있는 행사 운영 전용 콘솔로
                네트워킹이 자연스럽게 일어나는 행사를 만들어 보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login?type=admin&returnTo=/admin">
                  <Button className="w-full sm:w-auto h-11 px-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-sm font-semibold shadow-[0_0_25px_rgba(129,140,248,0.6)]">
                    지금 관리자 콘솔 시작하기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#contact" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full h-11 px-6 rounded-full border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-sm">
                    도입 상담 먼저 받아보기
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>행사 규모 30명부터 1,000명까지</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>사전 매칭 + 현장 체크인 + 사후 리포트</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>별도 앱 설치 없이 웹으로 이용</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="relative bg-white border border-slate-200 rounded-3xl shadow-xl">
                <CardContent className="p-6 lg:p-7 space-y-4">
                  <p className="text-[11px] font-medium text-indigo-600 uppercase tracking-wide">
                    ndrop Event Console 미리보기
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">이번 행사 네트워킹 지수</span>
                      <span className="text-xs text-emerald-500">+32% 향상</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-purple-500 to-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <p className="text-slate-500">참가자 기준 평균 네트워킹 수</p>
                        <p className="text-sm font-semibold">4.2회</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">사전 매칭 수락률</p>
                        <p className="text-sm font-semibold">68%</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
                    <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-300" />
                        <span className="font-semibold text-xs text-slate-800">매칭 참여자</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">124명</p>
                      <p className="text-slate-500">전체의 82%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-300" />
                        <span className="font-semibold text-xs text-slate-800">성사된 미팅</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">89건</p>
                      <p className="text-slate-500">취소율 6%</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="font-semibold text-xs text-slate-800">만족도</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">4.7점</p>
                      <p className="text-slate-500">5점 만점</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6" id="change">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-purple-200 uppercase tracking-wide">
                  ndrop이 만드는 변화
                </p>
                <h2 className="mt-2 text-xl lg:text-2xl font-bold">
                  네트워킹이 잘 되었는지,
                  <br />
                  숫자로 명확하게 확인할 수 있습니다.
                </h2>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 max-w-md">
                출석률, 매칭 참여율, 성사된 미팅 수, 만족도 같은 핵심 지표로
                네트워킹 결과를 한눈에 보고, 다음 회차 기획에 바로 참고할 수 있습니다.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    자연스럽게 연결되는 참가자 경험
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    참가자들이 사전에 서로의 프로필을 확인하고
                    관심 있는 사람에게 미팅을 요청할 수 있어,
                    현장에서 어색함 없이 대화를 시작할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    운영자가 한눈에 보는 핵심 지표
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    출석률, 매칭 참여율, 1인당 네트워킹 수, 만족도까지
                    리포트 화면에서 한 번에 확인하고
                    스폰서 및 내부 보고 자료로 바로 활용할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    운영 리소스를 줄이는 자동화
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    참가자 등록, 현장 체크인, 알림 발송, 매칭 관리까지
                    반복적인 수작업을 줄이고 운영팀은
                    콘텐츠와 경험 설계에 집중할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6" id="how">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-purple-200 uppercase tracking-wide">
                  사용 방법
                </p>
                <h2 className="mt-2 text-xl lg:text-2xl font-bold">
                  복잡한 온보딩 없이
                  <br />
                  세 단계면 충분합니다.
                </h2>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="bg-slate-900/70 border-white/10 rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs font-semibold text-purple-300">STEP 1</p>
                  <h3 className="text-sm font-semibold">행사 생성 및 기본 설정</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    관리자 콘솔에서 행사 정보를 입력하고,
                    네트워킹 방식(사전매칭/현장매칭)과
                    참가 대상, 운영 인원 등을 간단히 설정합니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/70 border-white/10 rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs font-semibold text-purple-300">STEP 2</p>
                  <h3 className="text-sm font-semibold">참가자 모집 및 사전 네트워킹</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    참가자에게 ndrop 링크를 안내하면
                    본인의 프로필을 작성하고, 관심사 기반으로
                    미리 네트워킹 상대를 찾아볼 수 있습니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/70 border-white/10 rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs font-semibold text-purple-300">STEP 3</p>
                  <h3 className="text-sm font-semibold">현장 운영과 사후 리포트</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    QR 체크인과 디지털 명함으로 현장을 운영하고,
                    행사 종료 후에는 리포트 화면에서
                    정량·정성 데이터를 함께 확인할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6" id="pricing">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-purple-200 uppercase tracking-wide">
                  요금제
                </p>
                <h2 className="mt-2 text-xl lg:text-2xl font-bold">
                  행사 규모와 목적에 맞게
                  <br />
                  유연하게 설계된 가격 정책.
                </h2>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 max-w-md">
                SaaS형 사용료와 행사 단위의 프로젝트 형태 모두 가능합니다.
                자세한 견적은 행사 규모와 운영 범위를 기준으로
                맞춤으로 안내드립니다.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-300">Starter</p>
                  <h3 className="text-lg font-bold">소규모 이벤트</h3>
                  <p className="text-xs text-slate-600">
                    네트워킹을 처음 도입하는
                    30~80명 규모의 행사에 적합합니다.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      기본 참가자 관리 및 체크인
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      디지털 명함 및 기본 리포트
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">
                    정확한 금액은 문의 후 행사 내용에 따라 제안드립니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-indigo-50 border-indigo-200 rounded-2xl shadow-[0_12px_30px_rgba(79,70,229,0.12)] scale-[1.02]">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-indigo-700">Standard</p>
                  <h3 className="text-lg font-bold">콘퍼런스 / 리크루팅 데이</h3>
                  <p className="text-xs text-slate-700">
                    100~300명 규모의 콘퍼런스, 리크루팅 행사,
                    사내 네트워킹에 최적화된 구성입니다.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      사전 매칭 + 현장 매칭 기능
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      커스텀 설문 및 피드백 리포트
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      기본 온보딩/행사 셋업 지원
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-slate-600">
                    행사·세션 수, 스폰서 요구사항에 따라 개별 견적을 드립니다.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-300">Enterprise</p>
                  <h3 className="text-lg font-bold">대규모 / 연간 프로그램</h3>
                  <p className="text-xs text-slate-600">
                    연간 프로그램, 대규모 채용 박람회, 복수 회차 운영 등
                    보다 깊은 커스터마이징이 필요한 경우를 위한 플랜입니다.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      연간/복수 행사 단위 계약
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      운영 매뉴얼 및 온사이트 지원 옵션
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      데이터 연동 / 커스텀 리포트 협의
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">
                    현재 사용 중인 시스템과의 연동 여부까지 포함해 상담 드립니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6" id="contact">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-purple-200 uppercase tracking-wide">
                  도입 문의
                </p>
                <h2 className="mt-2 text-xl lg:text-2xl font-bold">
                  행사 정보를 간단히 남겨주시면
                  <br />
                  운영 방식에 맞는 구성을 함께 설계해드립니다.
                </h2>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 max-w-md">
                도입 여부가 확정되지 않아도 괜찮습니다.
                현재 고민하고 계신 포인트와 행사 계획만 공유해 주셔도
                ndrop으로 어떤 변화가 가능한지 함께 고민해 드립니다.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-6 lg:p-7 space-y-4">
                  <form
                    className="space-y-4"
                    onSubmit={e => {
                      e.preventDefault()
                      if (typeof window !== "undefined") {
                        window.alert("문의가 임시로 접수되었습니다.\n상세한 도입 문의는 추후 연결된 담당자 이메일로 이어집니다.")
                      }
                    }}
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5 text-xs">
                        <label htmlFor="company" className="text-slate-700">
                          조직명 / 브랜드명
                        </label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="예: ndrop, A기업 리크루팅팀"
                          className="bg-white border-slate-200 text-xs placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label htmlFor="name" className="text-slate-700">
                          담당자 성함
                        </label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="이름을 입력해주세요"
                          className="bg-white border-slate-200 text-xs placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5 text-xs">
                        <label htmlFor="email" className="text-slate-700">
                          연락 가능한 이메일
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="contact@company.com"
                          className="bg-white border-slate-200 text-xs placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label htmlFor="people" className="text-slate-700">
                          예상 참가자 수
                        </label>
                        <Input
                          id="people"
                          name="people"
                          placeholder="예: 약 120명"
                          className="bg-white border-slate-200 text-xs placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <label htmlFor="message" className="text-slate-700">
                        행사 목적 및 고민하고 계신 부분
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="예: 개발자 커뮤니티 행사를 준비 중이며, 참가자들이 실제로 대화를 많이 나누도록 도와줄 수 있는지 궁금합니다."
                        className="bg-white border-slate-200 text-xs placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-sm font-semibold"
                    >
                      도입 문의 보내기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-[11px] text-slate-500">
                      입력해주신 정보는 ndrop 도입 관련 상담 외의 목적으로 사용되지 않습니다.
                    </p>
                  </form>
                </CardContent>
              </Card>
              <div className="space-y-4 text-xs lg:text-sm text-slate-600">
                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <p className="font-semibold text-slate-800">
                      이런 분들께 특히 잘 맞습니다
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    <li>· 행사마다 네트워킹 설계를 매번 처음부터 고민하고 계신 분</li>
                    <li>· 참가자 피드백은 있지만 실제 네트워킹 지표는 잡지 못하신 분</li>
                    <li>· 사내/커뮤니티 네트워킹을 정기적으로 운영하고 싶으신 분</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    공식 제안서/소개서가 필요하신가요?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    하단 문의 폼 또는 공식 이메일로 연락 주시면,
                    운영팀에서 행사 유형에 맞는 ndrop 소개 자료를 함께 전달드립니다.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    공식 이메일:{" "}
                    <span className="font-semibold text-slate-800">
                      support@ndrop.kr
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-8 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-12">
          <p>© 2024 ndrop. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a href="mailto:support@ndrop.kr" className="hover:text-slate-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>support@ndrop.kr</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
