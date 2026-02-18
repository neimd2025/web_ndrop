"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminStartPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">운영 대시보드</h1>
        <p className="text-sm text-gray-500">
          아직 생성된 행사가 없습니다. 새 이벤트를 만들어 ndrop Event Console을 시작하세요.
        </p>
        <div className="flex items-center justify-center">
          <Link href="/admin/events/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-5">
              새 이벤트 만들기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
