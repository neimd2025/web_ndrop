"use client"

import MobileHeader from "@/components/mobile-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserBusinessCard, UserProfile } from '@/lib/supabase/user-server-actions'
import { generateQRCodeUrl } from "@/lib/utils"
import { Download, Share } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

interface UserMyQRClientProps {
  user: UserProfile
  businessCards: UserBusinessCard[]
}

export function UserMyQRClient({ user, businessCards }: UserMyQRClientProps) {
  const router = useRouter()
  const userCard = businessCards.find(card => card.is_public) || businessCards[0]
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")

  useEffect(() => {
    const generateQRCode = async () => {
      if (!userCard?.id) {
        console.log("비즈니스 카드가 없습니다.")
        return
      }

      try {
        // 유틸리티 함수를 사용하여 QR 코드 URL 생성
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

    if (userCard) {
      generateQRCode()
    }
  }, [userCard])

  const handleShare = async () => {
    if (!qrUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.full_name || '내'} 명함`,
          text: '명함을 공유합니다',
          url: qrUrl,
        })
      } catch (error) {
        console.error('공유 실패:', error)
        fallbackShare()
      }
    } else {
      fallbackShare()
    }
  }

  const fallbackShare = () => {
    if (navigator.clipboard && qrUrl) {
      navigator.clipboard.writeText(qrUrl)
        .then(() => alert('링크가 클립보드에 복사되었습니다!'))
        .catch(() => alert('복사에 실패했습니다.'))
    }
  }

  const handleDownload = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = `${user?.full_name || 'my'}-qr-code.png`
    link.href = qrCodeDataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getUserDisplayName = () => {
    return userCard?.name || user?.full_name || user?.email?.split('@')[0] || "사용자"
  }

  const getUserCompanyInfo = () => {
    const jobTitle = userCard?.job_title || userCard?.title || user?.job_title
    const company = userCard?.company || user?.company
    if (jobTitle && company) return `${jobTitle} / ${company}`
    if (jobTitle) return jobTitle
    if (company) return company
    return "직책 / 회사"
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <MobileHeader title="내 QR코드" />

      <div className="px-5 py-6 space-y-6 relative z-10">
        {/* QR 코드 카드 */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">
                {getUserDisplayName()}
              </h2>
              <p className="text-slate-400 text-sm">
                QR코드를 스캔하면 내 명함을 볼 수 있어요
              </p>
            </div>

            {/* QR 코드 */}
            <div className="flex justify-center mb-6">
              {qrCodeDataURL ? (
                <div className="bg-white p-4 rounded-xl shadow-sm ">
                  <img
                    src={qrCodeDataURL}
                    alt="QR Code"
                    className="w-60 h-60"
                  />
                </div>
              ) : (
                <div className="w-60 h-60 bg-slate-800 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-slate-400 text-sm">QR 코드 생성 중...</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR 코드 URL */}
            {qrUrl && (
              <div className="mb-6">
                <p className="text-purple-400 text-sm font-medium break-all">
                  {qrUrl}
                </p>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex justify-between items-center gap-2">
              <Button
                onClick={handleShare}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none"
                disabled={!qrUrl}
              >
                <Share className="w-4 h-4 mr-2" />
                공유
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 hover:text-white"
                disabled={!qrCodeDataURL}
              >
                <Download className="w-4 h-4 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 사용법 안내 */}
        <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/images/icon/tip.png" alt="QR 코드 팁" width={16} height={16} className="" />
                <h3 className="font-semibold text-white">QR 코드 팁</h3>
              </div>
              <div className="pl-6">
                <ul className="text-sm text-slate-400 space-y-1 list-disc">
                  <li>상대방에게 QR 코드를 보여주세요</li>
                  <li>상대방이 카메라로 스캔하면 내 명함을 볼 수 있어요</li>
                  <li>QR 코드를 저장해서 인쇄물에도 사용할 수 있어요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
