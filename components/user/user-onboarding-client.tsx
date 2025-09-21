"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { BarChart3, ChevronLeft, ChevronRight, Heart, Link as LinkIcon, Smartphone, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UserOnboardingClientProps {
  user: UserProfile
}

export function UserOnboardingClient({ user }: UserOnboardingClientProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      icon: Heart,
      iconColor: "text-purple-600",
      title: "Neimed에 오신 것을 환영합니다!",
      description: "디지털 명함과 네트워킹의 새로운 세상에 오신 것을 환영합니다. 더 스마트하고 효율적인 비즈니스 연결을 경험해보세요.",
    },
    {
      icon: Smartphone,
      iconColor: "text-blue-600",
      title: "디지털 명함으로 네트워킹하세요",
      description: "종이 명함은 이제 그만! QR 코드 하나로 언제 어디서든 명함을 공유하세요. 분실 걱정도 없고 항상 최신 정보를 유지할 수 있어요.",
    },
    {
      icon: Users,
      iconColor: "text-green-600",
      title: "이벤트에서 쉽게 명함을 교환하세요",
      description: "네트워킹 이벤트나 컨퍼런스에서 QR 코드를 스캔해 명함을 주고받으세요. 번거로운 타이핑 없이 즉시 연락처가 저장됩니다.",
    },
    {
      icon: BarChart3,
      iconColor: "text-orange-600",
      title: "수집한 명함을 관리하세요",
      description: "받은 명함들을 체계적으로 정리하고 관리하세요. 검색 기능으로 필요한 연락처를 빠르게 찾고, 즐겨찾기로 중요한 인맥을 관리할 수 있어요.",
    },
    {
      icon: LinkIcon,
      iconColor: "text-red-600",
      title: "이제 나만의 명함을 만들어보세요!",
      description: "모든 준비가 끝났습니다! 나만의 디지털 명함을 만들어 전문적인 첫인상을 남겨보세요. 프로필, 연락처, 소개글까지 모두 담을 수 있어요.",
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleGetStarted = () => {
    router.push('/client/namecard/create')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-xl font-bold text-gray-900 text-center">환영합니다!</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-center px-5 py-8">
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="p-8 text-center">
            {/* 아이콘 */}
            <div className="mb-6">
              {React.createElement(slides[currentSlide].icon, {
                className: `w-16 h-16 mx-auto ${slides[currentSlide].iconColor}`
              })}
            </div>

            {/* 제목 */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {slides[currentSlide].title}
            </h2>

            {/* 설명 */}
            <p className="text-gray-600 leading-relaxed mb-8">
              {slides[currentSlide].description}
            </p>

            {/* 페이지 인디케이터 */}
            <div className="flex justify-center space-x-2 mb-8">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentSlide ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="text-sm text-gray-500">
                {currentSlide + 1} / {slides.length}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 시작하기 버튼 - 마지막 슬라이드에서만 표시 */}
        {currentSlide === slides.length - 1 && (
          <div className="max-w-md mx-auto w-full mt-8">
            <Button
              onClick={handleGetStarted}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              명함 생성하기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}