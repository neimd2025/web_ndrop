"use client"

import { Bell, Bookmark, Home, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const navItems = [
    { href: "/client/home", icon: Home, label: "홈" },
    { href: "/client/saved-cards", icon: Bookmark, label: "저장된 명함" },
    { href: "/client/notifications", icon: Bell, label: "알림" },
    { href: "/client/my-page", icon: User, label: "마이 메뉴" },
  ]

  const handleNavigation = async (href: string) => {
    if (pathname === href || isNavigating) return

    setIsNavigating(true)
    try {
      // 프로그래밍 방식으로 빠른 네비게이션
      router.push(href)
    } finally {
      // 짧은 지연 후 로딩 상태 해제
      setTimeout(() => setIsNavigating(false), 100)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              disabled={isNavigating}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 ${
                isActive ? "text-purple-600" : "text-gray-500 hover:text-purple-600"
              } transition-colors disabled:opacity-50`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? "text-purple-600" : ""}`} />
              <span className={`text-xs font-medium ${isActive ? "text-purple-600" : ""}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
