"use client"

import { Card, CardContent } from "@/components/ui/card"
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { BarChart3, Heart, Smartphone, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useState } from "react"

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
      titleColor: "text-blue-600",
      subtitleColor: "text-blue-600",
      title: "명함을 디지털로 종이명함",
      subtitle: "종이 명함은 이제 그만!",
      description: "디지털 명함으로 더 스마트하게 네트워킹하세요. 언제 어디서든 쉽게 공유할 수 있습니다.",
    },
    {
      icon: Smartphone,
      iconColor: "text-blue-600",
      titleColor: "text-green-600",
      subtitleColor: "text-green-600",
      title: "QR 코드로 간편하게",
      subtitle: "스캔 한 번으로 연결",
      description: "QR 코드를 스캔하면 바로 명함을 주고받을 수 있어요. 복잡한 과정은 필요 없습니다.",
    },
    {
      icon: Users,
      iconColor: "text-green-600",
      titleColor: "text-purple-600",
      subtitleColor: "text-purple-600",
      title: "이벤트에서 만나요",
      subtitle: "네트워킹 이벤트 참여",
      description: "다양한 이벤트에 참여하고 새로운 사람들과 연결되세요. 더 넓은 네트워크를 만들어보세요.",
    },
    {
      icon: BarChart3,
      iconColor: "text-orange-600",
      titleColor: "text-orange-600",
      subtitleColor: "text-orange-600",
      title: "연결을 관리하세요",
      subtitle: "수집한 명함 정리",
      description: "만난 사람들의 명함을 체계적으로 관리하고,언제든지 다시 연락할 수 있어요.",
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
    <div className="min-h-screen bg-gradient-to-br from-[#7E3CED] to-[#A553F6] flex flex-col">
      {/* 헤더 - 건너뛰기 버튼 */}
      <div className="flex justify-end px-5 pt-8 ">
        <button
          onClick={handleGetStarted}
          className="text-white text-sm font-medium hover:opacity-80"
        >
          건너뛰기
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-center px-5 py-8">
        <Card className="max-w-md mx-auto w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            {/* 아이콘 */}
            <div className="mb-6">
              {React.createElement(slides[currentSlide].icon, {
                className: `w-16 h-16 mx-auto ${slides[currentSlide].iconColor}`
              })}
            </div>

            {/* 제목 */}
            <h2 className={`text-2xl font-bold ${slides[currentSlide].titleColor}`}>
              {slides[currentSlide].title}
            </h2>
            <p className={`leading-relaxed mb-4 ${slides[currentSlide].subtitleColor}`}>
              {slides[currentSlide].subtitle}
            </p>
            {/* 설명 */}
            <p className="text-gray-800 leading-relaxed mb-8">
              {slides[currentSlide].description}
            </p>
          </CardContent>
        </Card>
      {/* 페이지 인디케이터 - 상단 */}
      <div className="flex justify-center pt-4 pb-4">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
        {/* 네비게이션 버튼 - 하단 */}
        <div className="max-w-md mx-auto w-full mt-8 flex justify-between items-center px-4">
          {/* 이전 버튼 */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white text-sm font-medium disabled:opacity-50"
          >
            &lt; 이전
          </button>

          {/* 다음/시작하기 버튼 */}
          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleGetStarted}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium shadow-lg"
            >
              시작하기
            </button>
          ) : (
            <button
              onClick={nextSlide}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium shadow-lg"
            >
              다음 &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
