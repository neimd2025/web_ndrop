import ConditionalAuthProvider from "@/components/conditional-auth-provider"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ndrop - AI 기반 행사 네트워킹 매칭 플랫폼",
  description: "행사 성과를 극대화하는 AI 네트워킹 플랫폼. 정교한 AI 매칭 기술로 최적의 참가자 연결을 추천하고, 현장에서 실질적인 비즈니스 네트워킹이 이루어지도록 지원합니다.",
  openGraph: {
    title: "ndrop - AI 기반 행사 네트워킹 매칭 플랫폼",
    description: "행사 성과를 극대화하는 AI 네트워킹 플랫폼. 정교한 AI 매칭 기술로 최적의 참가자 연결을 추천하고, 현장에서 실질적인 비즈니스 네트워킹이 이루어지도록 지원합니다.",
    url: "https://www.ndrop.kr",
    siteName: "ndrop",
    images: [
      {
        url: "https://www.ndrop.kr/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7C38ED',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ndrop" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        {/* 전체 앱 컨테이너 */}
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative">
          <ConditionalAuthProvider>
            {children}
          </ConditionalAuthProvider>
        </div>
        {/* 네비게이션바는 컨테이너 밖에서 하단 고정 */}
        <MobileBottomNav />
        <Toaster />
      </body>
    </html>
  )
}
