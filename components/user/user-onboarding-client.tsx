"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { BarChart3, ChevronLeft, ChevronRight, Link as LinkIcon, Smartphone, Users } from "lucide-react"
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
      icon: Smartphone,
      iconColor: "text-purple-600",
      title: "명함을 디지털로",
      description: "종이 명함은 이제 그만! 디지털 명함으로 더 스마트하게 네트워크하세요. 언제 어디서든지 쉽게 공유할 수 있습니다.",
    },
    {
      icon: LinkIcon,
      iconColor: "text-green-600",
      title: "QR 코드로 간편하게",
      description: "스캔 한 번으로 연결 QR 코드를 스캔하면 바로 명함을 주고받을 수 있어요. 번거로운 과정은 필요 없습니다.",
    },
    {
      icon: Users,
      iconColor: "text-orange-600",
      title: "이벤트에서 만나요",
      description: "네트워크 확장 이벤트 참여 다양한 이벤트에 참여하고 새로운 사람들과 연결하세요. 더 넓은 네트워크를 만들어보세요.",
    },
    {
      icon: BarChart3,
      iconColor: "text-red-600",
      title: "분석하고 성장하기",
      description: "명함 조회 분석 내 명함이 얼마나 조회되었는지 확인하고, 어떤 부분이 인기 있는지 알아보세요. 더 나은 명함으로 업그레이드!",
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

        {/* 시작하기 버튼 */}
        <div className="max-w-md mx-auto w-full mt-8">
          <Button
            onClick={handleGetStarted}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            명함 만들기
          </Button>
        </div>
      </div>
    </div>
  )
}