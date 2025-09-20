"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, ChevronLeft, ChevronRight, Link as LinkIcon, Smartphone, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function OnboardingPage() {
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
      title: "연결을 관리하세요",
      description: "수신인 명함 정리 만난 사람들과 명함을 체계적으로 관리하고, 언제든지 다시 연락할 수 있어요.",
    },
  ]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      // 마지막 슬라이드에서 시작하기 버튼 클릭 시
      handleStart()
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleStart = async () => {
    try {
      // 온보딩 완료 API 호출
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        localStorage.setItem('hasSeenOnboarding', 'true')
        router.push('/namecard/edit')
      } else {
        console.error('온보딩 완료 처리 실패')
        // 실패해도 명함 생성으로 이동
        router.push('/namecard/edit')
      }
    } catch (error) {
      console.error('온보딩 완료 처리 중 오류:', error)
      // 에러 발생해도 명함 생성으로 이동
      router.push('/namecard/edit')
    }
  }

  const handleSkip = async () => {
    try {
      // 온보딩 완료 API 호출
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      localStorage.setItem('hasSeenOnboarding', 'true')
    } catch (error) {
      console.error('온보딩 완료 처리 중 오류:', error)
    }
    router.push("/namecard/edit")
  }



  return (
    <div className="min-h-screen bg-purple-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-purple-600 font-bold text-sm">nd</span>
        </div>
        <Button
          variant="ghost"
          className="text-gray-300 hover:text-white hover:bg-white/10"
          onClick={handleSkip}
        >
          건너뛰기
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => {
              const SlideIcon = slide.icon
              return (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <CardContent className="p-8 text-center space-y-6">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                        <SlideIcon className={`h-10 w-10 ${slide.iconColor}`} />
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">{slide.title}</h2>
                      </div>

                      <p className="text-gray-600 leading-relaxed text-sm">{slide.description}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Page Indicators */}
        <div className="flex justify-center space-x-2 mt-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 pb-12">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 flex items-center"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          이전
        </Button>

        <Button
          className="bg-white text-purple-600 hover:bg-white/90 px-8 py-3 rounded-xl font-semibold flex items-center"
          onClick={nextSlide}
        >
          {currentSlide === slides.length - 1 ? (
            <>
              시작하기
              <ChevronRight className="h-5 w-5 ml-1" />
            </>
          ) : (
            <>
              다음
              <ChevronRight className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
