"use client"

import MobileHeader from "@/components/mobile-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBusinessCards } from "@/hooks/use-business-cards"
import { useUserProfile } from "@/hooks/use-user-profile"
import { generateQRCodeUrl } from "@/lib/utils"
import { Download, MapPin, Share } from "lucide-react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

export default function MyQRPage() {
  const router = useRouter()
  const { userCard, loading: cardLoading } = useBusinessCards()
  const { profile, loading: profileLoading } = useUserProfile()
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")

  useEffect(() => {
    const generateQRCode = async () => {
      if (!userCard?.id) {
        console.log("비즈니스 카드가 없습니다.")
        return
      }

      try {
        // 유틸리티 함수를 사용하여 QR명명명 코드 URL 생성
        const qrCodeUrl = generateQRCodeUrl(userCard.id)
        setQrUrl(qrCodeUrl)

        const url = await QRCode.toDataURL(qrCodeUrl, {
          width: 240,
          margin: 2,
          color: {
            dark: "#7C38ED",
            light: "#FFFFFF",
          },
        })
        setQrCodeDataURL(url)
      } catch (err) {
        console.error("QR Code generation failed:", err)
      }
    }

    if (!cardLoading && userCard) {
      generateQRCode()
    }
  }, [userCard, cardLoading])

  return (
    <div className="min-h-screen bg-white">
      <MobileHeader title="내 QR코드" showBackButton onBack={() => router.back()} showMenuButton />

      <div className="px-4 py-6 space-y-6">
        {/* QR Code Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {profile?.full_name || userCard?.full_name || "사용자"}
              </h2>
              <p className="text-gray-500">QR코드를 스캔하여 명함을 확인할 수 있어요</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-center">
                {cardLoading || profileLoading ? (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">로딩 중...</span>
                  </div>
                ) : qrCodeDataURL ? (
                  <img
                    src={qrCodeDataURL}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">QR 코드 생성 중...</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500">{qrUrl || "URL 로딩 중..."}</p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl"
                onClick={() => {
                  if (qrUrl && navigator.share) {
                    navigator.share({
                      title: `${profile?.full_name || userCard?.full_name || "사용자"}의 명함`,
                      text: "QR 코드를 스캔하여 명함을 확인하세요!",
                      url: qrUrl
                    })
                  } else if (qrUrl) {
                    navigator.clipboard.writeText(qrUrl)
                    alert("URL이 클립보드에 복사되었습니다!")
                  }
                }}
                disabled={!qrUrl}
              >
                <Share className="h-5 w-5 mr-2" />
                공유
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-200 py-3 rounded-xl bg-transparent"
                onClick={() => {
                  if (qrCodeDataURL) {
                    const link = document.createElement('a')
                    link.download = 'qr-code.png'
                    link.href = qrCodeDataURL
                    link.click()
                  }
                }}
                disabled={!qrCodeDataURL}
              >
                <Download className="h-5 w-5 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Usage Tip */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">QR 코드 사용 팁</h4>
                <p className="text-sm text-purple-700">
                  스마트폰 카메라로 QR코드를 스캔하거나, Neimd 앱의 QR 스캔 기능을 사용해보세요!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
