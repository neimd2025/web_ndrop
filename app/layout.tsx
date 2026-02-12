import ConditionalAuthProvider from "@/components/conditional-auth-provider"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ndrop - 모두의 특별함이 나답게 연결되는 시작",
  description: "당신의 이름에 담긴 의미를 발견하고, 특별한 명함을 만들어 세상과 연결되세요.",
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
