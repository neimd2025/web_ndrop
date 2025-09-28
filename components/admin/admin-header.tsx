"use client"

import { Button } from "@/components/ui/button"
import { Bell, Gift, MessageSquare, Plus, User, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin/events", icon: Plus, label: "이벤트 관리" },
    { href: "/admin/members", icon: Users, label: "회원관리" },
    { href: "/admin/feedback", icon: MessageSquare, label: "피드백" },
    { href: "/admin/coupons", icon: Gift, label: "쿠폰" },
    { href: "/admin/notifications", icon: Bell, label: "알림" },
  ]

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NN</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ndrop Network</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/admin/events/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              이벤트
            </Button>
          </Link>
          <Link href="/admin/my-page">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2 bg-white border-t border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`whitespace-nowrap ${
                    isActive
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
