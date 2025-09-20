"use client"

import { Bell, Bookmark, Home, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 온보딩, 웰컴, 로그인, 회원가입, 스플래시 페이지와 관리자 페이지에서는 하단 네비게이션 숨김
  const hideBottomNav =
    ["/", "/onboarding", "/welcome", "/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile/edit") ||
    pathname === "/client/onboarding"

  // 서버사이드 렌더링 중에는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null
  }

  if (hideBottomNav) {
    return null
  }

  const navItems = [
    { href: "/client/home", icon: Home, label: "홈" },
    { href: "/client/saved-cards", icon: Bookmark, label: "저장된 명함" },
    { href: "/client/notifications", icon: Bell, label: "알림" },
    { href: "/client/my-page", icon: User, label: "마이 메뉴" },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center py-2 pb-6 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 active:scale-95 ${
                isActive ? "text-purple-600" : "text-gray-500"
              }`}
            >
              <div className={`p-2 rounded-2xl transition-colors ${isActive ? "bg-purple-100" : "hover:bg-gray-100"}`}>
                <Icon className={`h-6 w-6 ${isActive ? "text-purple-600" : ""}`} />
              </div>
              <span className={`text-xs font-medium mt-1 ${isActive ? "text-purple-600" : ""}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
