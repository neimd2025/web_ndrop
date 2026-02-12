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
  description: "행사 참가자를 AI로 연결하는 네트워킹 매칭 플랫폼 ndrop.",
  openGraph: {
    title: "ndrop - AI 기반 행사 네트워킹 매칭 플랫폼",
    description: "행사 참가자를 AI로 연결하는 네트워킹 매칭 플랫폼 ndrop.",
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
